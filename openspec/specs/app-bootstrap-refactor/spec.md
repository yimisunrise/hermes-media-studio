## ADDED Requirements

### Requirement: AppBootstrap as entry orchestrator

The app entry point SHALL create three modules (MenuManager, ViewManager, Router) and coordinate them through a simple init sequence. It SHALL NOT contain menu rendering logic or view lifecycle management.

#### Scenario: Init sequence

- **WHEN** `MediaStudioApp.init()` is called
- **THEN** it SHALL create `MenuManager`, `ViewManager`, `Router` instances with shared dependencies
- **AND** SHALL invoke `ViewManager.initModules()` after init is complete
- **AND** SHALL invoke `MenuManager.render()` after init is complete

### Requirement: MenuManager as sole menu owner

MenuManager SHALL own `MENU_GROUPS` definition, `ICONS`, menu DOM creation, expand/collapse interaction, and active state highlighting.

#### Scenario: MenuManager renders menu

- **WHEN** `MenuManager.render(container)` is called
- **THEN** it SHALL create the menu DOM inside the container
- **AND** SHALL show all menu groups and items (no menu filter)

#### Scenario: MenuManager updates active state

- **WHEN** `MenuManager.setActiveView(viewName)` is called
- **THEN** it SHALL add `active` class to the corresponding `.ms-menu-item`
- **AND** SHALL expand the parent `.ms-menu-group` if not already expanded

### Requirement: ViewManager as view lifecycle orchestrator

ViewManager SHALL own view instantiation, dependency injection, route registration, render scheduling, and lifecycle coordination (pauseRefresh).

#### Scenario: ViewManager registers routes

- **WHEN** `ViewManager.initModules()` is called
- **THEN** it SHALL instantiate all view modules with shared deps
- **AND** SHALL register each view's render handler with Router
- **AND** SHALL pass `{ api, state, schemaRegistry }` as appropriate to each view

#### Scenario: ViewManager handles view switching

- **WHEN** a route change triggers a view render
- **THEN** ViewManager SHALL clear the container
- **AND** set loading indicator
- **AND** call `view.render(container, params)`

#### Scenario: ViewManager pauses all views

- **WHEN** `ViewManager.pauseAll()` is called
- **THEN** it SHALL call `pauseRefresh()` on all views that implement the method
