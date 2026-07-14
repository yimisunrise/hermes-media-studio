## 1. Pipeline Core

- [x] 1.1 Create `src/core/InitPipeline.js` with class InitPipeline: constructor({ api, schemaRegistry }), registerStep(name, { label, required, handler }), run({ onProgress }), getStepStatuses(), isComplete getter
- [x] 1.2 Extend `src/core/SchemaRegistry.js` writeBoot() to accept optional steps object and merge into boot.json; ensure BOOT_DEFAULTS.init_state defaults to "pending"
- [x] 1.3 Export InitPipeline from `src/core/index.js`

## 2. Built-in Init Steps

- [x] 2.1 Implement `create-dirs` step: loop DIRS_TO_CREATE, call api.mkdir(), call onProgress for each, set boot.json init_state to "booting" on first step execution
- [x] 2.2 Implement `bootstrap-core` step: call schemaRegistry.bootstrapSystemDb(), then create .database/main/ dir + write db.json + update top-level .database/db.json registry
- [x] 2.3 Implement `seed-configs` step: check if configs/workflows/task-lifecycle.json exists via api.exists(), if not create default with basic media task type
- [x] 2.4 Implement `mark-done` step: call schemaRegistry.markBootComplete() to set init_state "done" + boot_id + created_at

## 3. App.js Integration

- [x] 3.1 In app.js init(): instantiate schemaRegistry and pipeline; read boot.json, set _workspaceReady based on init_state === "done"
- [x] 3.2 Replace _createWorkspaceDirectories() call in _renderInitView() with pipeline.run({ onProgress }) — init button triggers pipeline
- [x] 3.3 Remove _writeInitMarker() method (absorbed into pipeline steps)
- [x] 3.4 Wire progress callback to update UI (progressEl.innerHTML) and handle success/failure from pipeline result
- [x] 3.5 On ms:activated event, use schemaRegistry.readBoot() instead of api.checkInitialized() to check workspace state

## 4. Verification

- [x] 4.1 Run `find src -name "*.js" -exec node --check {} \;` to verify no syntax errors
