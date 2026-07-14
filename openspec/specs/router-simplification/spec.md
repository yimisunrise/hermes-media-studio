## ADDED Requirements

### Requirement: Dynamic view derivation

The Router SHALL derive the valid view list from registered routes rather than from a hardcoded constant. Registering a route SHALL automatically make it navigable.

#### Scenario: Register makes view navigable

- **WHEN** `router.register('foo', renderFn)` is called
- **THEN** navigating to `#foo` SHALL invoke `renderFn`
- **AND** `#foo` SHALL be considered valid

#### Scenario: Unknown hash falls back to default

- **WHEN** the hash is not a registered route
- **THEN** Router SHALL navigate to the default view (configurable, default: `'kanban'`)

### Requirement: Simplified Router API

The Router SHALL NOT need VIEWS constant or change tracking for view name validity.

#### Scenario: No VIEWS constant

- **WHEN** Router is imported
- **THEN** there SHALL be no `VIEWS` array in the module scope
- **AND** the Router SHALL use `this.routes` keys for validity checks

#### Scenario: Hash change handling

- **WHEN** hashchange fires with a hash like `#foo/param1/param2`
- **THEN** Router SHALL extract `'foo'` as view name and `['param1', 'param2']` as params
- **AND** SHALL render the registered handler for `'foo'`
