import {
  TextDocument,
  TextDocumentChangeEvent,
  Uri,
  window,
  workspace,
} from "vscode";
import { docs, getFileExtensionGlob } from "./data.mts";
import { Document } from "./document.mts";
import { updateDiagnosticCollection } from "./updateDiagnosticCollection.mts";

/**
 * Creates a function to add a document to the internal store.
 *
 * @param overwrite - Whether to overwrite an existing document.
 * @returns A function that accepts a document and adds it to the store.
 */
const setDoc = (overwrite: boolean) => (doc: TextDocument) => {
  const { uri, languageId } = doc;
  const url = uri.toString();

  if (
    extern.docs.has(url) === overwrite &&
    extern.Document.isApplicable(languageId, uri)
  ) {
    extern.docs.set(url, new extern.Document(doc));
  }
};

/**
 * Wraps a function to ensure the diagnostic collection is updated after it
 * runs.
 *
 * @param callback - The function to wrap.
 * @returns A new async function that calls the original function and then
 *          updates diagnostics.
 */
const withDiagnostics =
  <T extends any[], R>(callback: (...args: T) => R) =>
  async (...args: T) => {
    await callback(...args);
    extern.updateDiagnosticCollection();
  };

/**
 * Wraps a function to operate on a document specified by a URI.
 *
 * @param callback - Function that receives a text document.
 * @returns A new async function that accepts a URI, opens the corresponding
 *          document, and calls the original function.
 */
const withUri =
  <T extends unknown>(callback: (doc: TextDocument) => T) =>
  async (uri: Uri) => {
    try {
      return callback(await extern.workspace.openTextDocument(uri));
    } catch (error) {
      extern.window.showErrorMessage(`Failed to open ${uri.fsPath}: ${error}`);
    }
    return;
  };

/**
 * Wraps a function to operate on multiple files.
 *
 * @param callback - Function that receives a single file.
 * @returns A new function that accepts an object with a list of files and
 *          applies the callback to each file.
 */
const withFiles =
  <T, I>(callback: (uri: I) => T) =>
  ({ files }: { files: readonly I[] }) =>
    Promise.all(files.map(callback));

/**
 * Removes documents that are no longer applicable from the internal store.
 */
export const pruneDocs = () => {
  for (const [url, cur] of extern.docs) {
    if (!cur.isApplicable()) {
      extern.docs.delete(url);
    }
  }
};

/**
 * Populates the internal document store with currently open documents and files
 * matching the configured file extensions.
 */
export const populateDocs = async () => {
  const fileExtensionGlob = extern.getFileExtensionGlob();

  extern.workspace.textDocuments.forEach(extern.onDidCreate);

  if (fileExtensionGlob) {
    const files = await extern.workspace.findFiles(fileExtensionGlob);
    await Promise.all(files.map(extern.onDidCreateUri));
  }
};

/**
 * Handles updates when a text document is edited.
 *
 * @param e - The text document change event.
 */
export const onDidEdit = (e: TextDocumentChangeEvent) =>
  extern.docs.get(e.document.uri.toString())?.scheduleUpdate(e);

/**
 * Handles updates when a text document is renamed.
 *
 * @param params - Object containing the old and new URIs of the document.
 * @param params.oldUri - The previous URI of the document.
 * @param params.newUri - The new URI of the document.
 */
export const onDidRename = async ({
  oldUri,
  newUri,
}: {
  oldUri: Uri;
  newUri: Uri;
}) => {
  const oldUrl = oldUri.toString();
  const cur = extern.docs.get(oldUrl);

  if (cur) {
    cur.uri = newUri;
    extern.docs.delete(oldUrl);
    extern.docs.set(newUri.toString(), cur);
  }
};

/**
 * Handles the deletion of a text document by removing it from the internal
 * store.
 *
 * @param uri - The URI of the deleted document.
 */
export const onDidDeleteUri = (uri: Uri) => extern.docs.delete(uri.toString());

export const onDidCreate = setDoc(false);
export const onDidChange = setDoc(true);
export const onDidCreateUri = withUri(onDidCreate);
export const onDidChangeUri = withUri(onDidChange);
export const onDidCreateFiles = withFiles(onDidCreateUri);
export const onDidDeleteFiles = withFiles(onDidDeleteUri);
export const onDidRenameFiles = withFiles(onDidRename);
export const onDidChangeUriDiagnostics = withDiagnostics(onDidChangeUri);
export const onDidCreateUriDiagnostics = withDiagnostics(onDidCreateUri);
export const onDidDeleteUriDiagnostics = withDiagnostics(onDidDeleteUri);
export const onDidCreateFilesDiagnostics = withDiagnostics(onDidCreateFiles);
export const onDidDeleteFilesDiagnostics = withDiagnostics(onDidDeleteFiles);
export const onDidCreateDiagnostics = withDiagnostics(onDidCreate);
export const onDidRenameFilesDiagnostics = withDiagnostics(onDidRenameFiles);

let extern = {
  window,
  workspace,
  docs,
  getFileExtensionGlob,
  Document,
  updateDiagnosticCollection,
  onDidCreate,
  onDidCreateUri,
};

/* v8 ignore start */
if (import.meta.vitest) {
  const {
    describe,
    it,
    expect,
    afterAll,
    vi: { fn },
  } = import.meta.vitest;
  const origExtern = extern;
  extern = {} as typeof extern;

  describe("documents", () => {
    afterAll(() => {
      extern = origExtern;
    });

    it("setDoc - adds a Document when overwrite matches and isApplicable is true", () => {
      const mockUri = { toString: fn(() => "u") };
      const mockDoc = { uri: mockUri, languageId: "ts" } as any;

      const mockDocs = new Map();
      const mockInstance = {};
      const MockDocument = Object.assign(
        fn(() => mockInstance),
        {
          isApplicable: fn(() => true),
        }
      ) as any;

      extern.docs = mockDocs;
      extern.Document = MockDocument;

      // has(url) === false, overwrite === false
      setDoc(false)(mockDoc);
      expect(mockDocs.get("u")).toBe(mockInstance);
      expect(MockDocument).toHaveBeenCalledWith(mockDoc);
    });

    it("setDoc - does nothing when overwrite does not match", () => {
      const mockUri = { toString: fn(() => "u") };
      const mockDoc = { uri: mockUri, languageId: "ts" } as any;

      const mockDocs = new Map([["u", {}]]) as any;
      const MockDocument = Object.assign(fn(), {
        isApplicable: fn(() => true),
      });

      extern.docs = mockDocs;
      extern.Document = MockDocument;

      // has(url) === true, overwrite === false
      setDoc(false)(mockDoc);
      expect(mockDocs.get("u")).toEqual({});
      expect(MockDocument).not.toHaveBeenCalled();
    });

    it("setDoc - does nothing when isApplicable is false", () => {
      const mockUri = { toString: fn(() => "u") };
      const mockDoc = { uri: mockUri, languageId: "ts" } as any;

      const mockDocs = new Map();
      const MockDocument = Object.assign(fn(), {
        isApplicable: fn(() => false),
      });

      extern.docs = mockDocs;
      extern.Document = MockDocument;

      setDoc(false)(mockDoc);
      expect(mockDocs.size).toBe(0);
      expect(MockDocument).not.toHaveBeenCalled();
    });

    it("withDiagnostics - calls the wrapped callback and then updateDiagnosticCollection", async () => {
      const mockCallback = fn(async (_a, _b) => "done");
      const mockUpdateDiagnostics = fn();

      extern.updateDiagnosticCollection = mockUpdateDiagnostics;

      const wrapped = withDiagnostics(mockCallback);
      await wrapped("arg1", "arg2");

      expect(mockCallback).toHaveBeenCalledWith("arg1", "arg2");
      expect(mockUpdateDiagnostics).toHaveBeenCalledTimes(1);
      // Ensure correct order: callback first, diagnostics second
      expect(mockUpdateDiagnostics.mock.invocationCallOrder[0]).toBeGreaterThan(
        mockCallback.mock.invocationCallOrder[0]!
      );
    });

    it("withUri - calls the callback with the opened document on success", async () => {
      const mockDoc = { name: "mockDoc" } as any;
      const mockCallback = fn(() => "result");
      extern.workspace = { openTextDocument: fn(async () => mockDoc) } as any;
      extern.window = { showErrorMessage: fn() } as any;

      const wrapped = withUri(mockCallback);
      const result = await wrapped({ fsPath: "file" } as any);

      expect(mockCallback).toHaveBeenCalledWith(mockDoc);
      expect(result).toBe("result");
      expect(extern.window.showErrorMessage).not.toHaveBeenCalled();
    });

    it("withUri - shows error message and returns undefined if openTextDocument throws", async () => {
      const mockCallback = fn();
      extern.workspace = {
        openTextDocument: fn(async () => {
          throw new Error("fail");
        }),
      } as any;
      extern.window = { showErrorMessage: fn() } as any;

      const wrapped = withUri(mockCallback);
      const result = await wrapped({ fsPath: "file" } as any);

      expect(result).toBeUndefined();
      expect(mockCallback).not.toHaveBeenCalled();
      expect(extern.window.showErrorMessage).toHaveBeenCalledWith(
        "Failed to open file: Error: fail"
      );
    });

    it("withFiles - applies the callback to each file and returns the results", async () => {
      const mockCallback = fn((x: number) => x + 1);
      const input = { files: [1, 2, 3] };
      const wrapped = withFiles(mockCallback);

      const result = await wrapped(input);

      expect(result).toEqual([2, 3, 4]);
      expect(mockCallback).toHaveBeenCalledTimes(3);

      // only check the first argument of each call
      expect(mockCallback.mock.calls[0]![0]).toBe(1);
      expect(mockCallback.mock.calls[1]![0]).toBe(2);
      expect(mockCallback.mock.calls[2]![0]).toBe(3);
    });

    it("withFiles - returns an empty array when files is empty", async () => {
      const mockCallback = fn();
      const input = { files: [] };
      const wrapped = withFiles(mockCallback);

      const result = await wrapped(input);

      expect(result).toEqual([]);
      expect(mockCallback).not.toHaveBeenCalled();
    });

    it("pruneDocs - removes docs where isApplicable returns false", () => {
      const docKeep = { isApplicable: fn(() => true) };
      const docRemove = { isApplicable: fn(() => false) };

      const mockDocs = new Map([
        ["keep", docKeep],
        ["remove", docRemove],
      ]) as any;

      extern.docs = mockDocs;

      pruneDocs();

      expect([...extern.docs.keys()]).toEqual(["keep"]);
      expect(mockDocs.get("keep")).toBe(docKeep);
      expect(mockDocs.has("remove")).toBe(false);
    });

    it("populateDocs - processes textDocuments and files when glob exists", async () => {
      const mockTextDocs = ["doc1", "doc2"];
      const mockFiles = ["file1", "file2"];
      const onDidCreate = fn(_a => {});
      const onDidCreateUri = fn(async _a => {});
      const findFiles = fn(async () => mockFiles);
      const getFileExtensionGlob = fn(() => "*.ts");

      extern.workspace = { textDocuments: mockTextDocs, findFiles } as any;
      extern.onDidCreate = onDidCreate;
      extern.onDidCreateUri = onDidCreateUri;
      extern.getFileExtensionGlob = getFileExtensionGlob;

      await populateDocs();

      // textDocuments processed (forEach) — check only first argument
      expect(onDidCreate).toHaveBeenCalledTimes(mockTextDocs.length);
      expect(onDidCreate.mock.calls[0]![0]).toBe("doc1");
      expect(onDidCreate.mock.calls[1]![0]).toBe("doc2");

      // files processed (map) — check only first argument
      expect(findFiles).toHaveBeenCalledWith("*.ts");
      expect(onDidCreateUri).toHaveBeenCalledTimes(mockFiles.length);
      expect(onDidCreateUri.mock.calls[0]![0]).toBe("file1");
      expect(onDidCreateUri.mock.calls[1]![0]).toBe("file2");
    });

    it("populateDocs - processes only textDocuments when glob is falsy", async () => {
      const mockTextDocs = ["doc1", "doc2"];
      const onDidCreate = fn();
      const onDidCreateUri = fn();
      const findFiles = fn();
      const getFileExtensionGlob = fn(() => undefined) as any;

      extern.workspace = { textDocuments: mockTextDocs, findFiles } as any;
      extern.onDidCreate = onDidCreate;
      extern.onDidCreateUri = onDidCreateUri;
      extern.getFileExtensionGlob = getFileExtensionGlob;

      await populateDocs();

      // textDocuments processed (forEach) — check only first argument
      expect(onDidCreate).toHaveBeenCalledTimes(mockTextDocs.length);
      expect(onDidCreate.mock.calls[0]![0]).toBe("doc1");
      expect(onDidCreate.mock.calls[1]![0]).toBe("doc2");

      // no files processed
      expect(findFiles).not.toHaveBeenCalled();
      expect(onDidCreateUri).not.toHaveBeenCalled();
    });

    it("onDidEdit - calls scheduleUpdate on the doc if it exists", () => {
      const mockEvent = {
        document: { uri: { toString: () => "uri1" } },
      } as any;
      const scheduleUpdate = fn();
      const mockDoc = { scheduleUpdate };
      extern.docs = new Map([["uri1", mockDoc]]) as any;

      onDidEdit(mockEvent);

      expect(scheduleUpdate).toHaveBeenCalledTimes(1);
      expect(scheduleUpdate).toHaveBeenCalledWith(mockEvent);
    });

    it("onDidEdit - does nothing if the doc does not exist", () => {
      const mockEvent = {
        document: { uri: { toString: () => "missing" } },
      } as any;
      extern.docs = new Map();

      expect(() => onDidEdit(mockEvent)).not.toThrow();
    });

    it("onDidRename - updates the doc uri and moves it in the map when doc exists", async () => {
      const oldUri = { toString: () => "old" } as any;
      const newUri = { toString: () => "new" } as any;
      const mockDoc = { uri: oldUri };
      extern.docs = new Map([["old", mockDoc]]) as any;

      await onDidRename({ oldUri, newUri });

      expect(extern.docs.has("old")).toBe(false);
      expect(extern.docs.has("new")).toBe(true);
      expect(extern.docs.get("new")).toBe(mockDoc);
      expect(mockDoc.uri).toBe(newUri);
    });

    it("onDidRename - does nothing when doc does not exist", async () => {
      const oldUri = { toString: () => "missing" } as any;
      const newUri = { toString: () => "new" } as any;
      extern.docs = new Map();

      await onDidRename({ oldUri, newUri });

      expect(extern.docs.size).toBe(0);
    });

    it("onDidDeleteUri - removes the doc from the map if it exists", () => {
      const uri = { toString: () => "doc1" } as any;
      const mockDoc = {};
      extern.docs = new Map([["doc1", mockDoc]]) as any;

      onDidDeleteUri(uri);

      expect(extern.docs.has("doc1")).toBe(false);
    });
  });
}
/* v8 ignore stop */
