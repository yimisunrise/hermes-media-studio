## ADDED Requirements

### Requirement: Unused view modules removed

View modules that have never been registered as routes and have no internal references SHALL be removed from the source tree.

#### Scenario: GenerationConsole.js removed

- **WHEN** cleanup is applied
- **THEN** `src/views/GenerationConsole.js` SHALL NOT exist
- **AND** no other module SHALL import it

#### Scenario: ThemeStrategy.js removed

- **WHEN** cleanup is applied
- **THEN** `src/views/ThemeStrategy.js` SHALL NOT exist
- **AND** no other module SHALL import it

#### Scenario: PackageEditor.js removed

- **WHEN** cleanup is applied
- **THEN** `src/views/PackageEditor.js` SHALL NOT exist
- **AND** its imported sub-components (PlatformSelector, ThemeSelector) SHALL be removed too if they have no other consumers

#### Scenario: StatsDashboard.js removed

- **WHEN** cleanup is applied
- **THEN** `src/views/StatsDashboard.js` SHALL NOT exist
- **AND** no other module SHALL import it

### Requirement: Orphaned component files removed

Component files that were only used by removed view modules SHALL also be removed.

#### Scenario: PlatformSelector.js removed

- **WHEN** PackageEditor.js is removed and PlatformSelector has no remaining consumers
- **THEN** `src/views/components/PlatformSelector.js` SHALL NOT exist

#### Scenario: ThemeSelector.js removed

- **WHEN** PackageEditor.js is removed and ThemeSelector has no remaining consumers
- **THEN** `src/views/components/ThemeSelector.js` SHALL NOT exist

### Requirement: Obsolete CSS removed

CSS classes that were only used by removed views or the old init system SHALL be removed from `app.css`.

#### Scenario: Obsolete classes removed

- **WHEN** cleanup is applied
- **THEN** `app.css` SHALL NOT contain rules for `.ms-setup-success` or `.ms-setup-error` (these were already removed in a prior change but verify)
- **AND** SHALL NOT contain rules for `.ms-generation-console`, `.ms-theme-strategy`, `.ms-package-editor`, `.ms-stats-dashboard` or any other removed view's root class
