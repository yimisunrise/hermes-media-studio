## 1. Tree Data Structure

- [x] 1.1 Define `INIT_TREE` constant in `src/app.js` — a recursive tree array with `{ name, type, children?, step? }` covering all dirs, files, database skeleton, and config files
- [x] 1.2 Add `.system/boot.json` and `.database/` subtree entries (not in DIRS_TO_CREATE but created by pipeline)

## 2. Tree Rendering

- [x] 2.1 Implement `_renderTree(tree, containerEl)` recursive method that renders each node as a `<div>` with indentation, directory/file icon, name, and optional step data attribute
- [x] 2.2 Replace flat `DIRS_TO_CREATE` list in `_renderInitView()` with tree rendering — both the uninitialized preview and the completed state

## 3. Existing-Item Detection

- [x] 3.1 On init page render, call `api.tree('.')` to fetch existing top-level entries and mark matching tree nodes with a `.exists` class (✅ checkmark)
- [x] 3.2 Handle the async case: render tree immediately, then asynchronously update checkmarks when API returns

## 4. Pipeline Progress Integration

- [x] 4.1 Update onProgress callback in `_renderInitView()` to scan tree for nodes matching the step name and add `.done` class (✅)
- [x] 4.2 On pipeline completion (`result.ok === true`), force all remaining tree nodes to `.done` state

## 5. CSS Styling

- [x] 5.1 Add tree styles to `src/app.css`: `.ms-init-tree`, `.ms-init-tree-node`, `.ms-init-tree-leaf`, indent via padding-left, icon via `::before` with content, `.exists` and `.done` checkmark states, distinct dir/file icon styling

## 6. Verification

- [x] 6.1 Run `find src -name "*.js" -exec node --check {} \;` to verify no syntax errors
