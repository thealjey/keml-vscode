## 0.0.3

- Cosmetic improvements to some diagnostic ranges.
- Implemented a robust, deterministic method for identifying
  **definitely valid** and **definitely invalid** action names.
- Added automatic cleanup for virtual documents when they are closed.

## 0.0.2

- fixed an attribute resolution bug
- removed edit batching, as it was more trouble than it is worth, because too
  many interconnected things require for the document to always be up to date
  for batching to be feasible

## 0.0.1

- Initial release
