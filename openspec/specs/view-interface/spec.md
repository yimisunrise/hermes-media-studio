## ADDED Requirements

### Requirement: ViewInterface contract

All view modules SHALL implement a consistent interface. The interface is defined by convention (JSDoc @interface) rather than by class inheritance.

#### Scenario: View constructor accepts deps

- **WHEN** a view module is instantiated via `new View(deps)`
- **THEN** `deps` SHALL be an object containing `{ api, state }` at minimum
- **AND** DatabaseManager SHALL additionally receive `{ schemaRegistry, DataRepository }`

#### Scenario: View has render method

- **WHEN** `view.render(container, params)` is called
- **THEN** `container` SHALL be an HTMLElement
- **AND** `params` SHALL be a string array from the URL hash
- **AND** the method SHALL populate the container with view DOM

#### Scenario: View has destroy method (optional)

- **WHEN** `view.destroy()` is called (if implemented)
- **THEN** the view SHALL clean up all DOM and event listeners it created

#### Scenario: View has pauseRefresh method (optional)

- **WHEN** `view.pauseRefresh()` is called (if implemented)
- **THEN** the view SHALL stop any active polling or background refresh

### Requirement: ViewManager validates interface

ViewManager SHALL validate that each view implements the required `render` method at registration time.

#### Scenario: View without render throws

- **WHEN** ViewManager encounters a view whose `render` is not a function
- **THEN** it SHALL throw an error with `<viewName> does not implement render()`
