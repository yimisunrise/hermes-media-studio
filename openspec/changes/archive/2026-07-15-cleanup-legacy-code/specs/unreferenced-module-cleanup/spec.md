## ADDED Requirements

### Requirement: Remove unreferenced agent module files

The system SHALL remove the entire `src/business/agent/` directory containing files created in the `creation-module-redesign` change that have not been imported or referenced by any other module:
- `src/business/agent/BriefBuilder.js`
- `src/business/agent/ResultParser.js`
- `src/business/agent/AgentHandler.js`
- `src/business/agent/index.js`

#### Scenario: Verify agent module is not referenced
- **WHEN** the implementation checks for usages of these files
- **THEN** no import statement in any .js file references `business/agent/`
- **THEN** the entire `src/business/agent/` directory SHALL be removed

### Requirement: Remove outdated README

The system SHALL remove `src/README.md` as its content describes an obsolete architecture (modules/ directory) that no longer exists.

#### Scenario: Remove outdated README
- **WHEN** the implementation removes `src/README.md`
- **THEN** the file SHALL no longer exist

### Requirement: Remove unused search utility

The system SHALL remove `src/framework/utils/search.js` as its `buildSearchIndex()` function has zero references across the codebase.

#### Scenario: Remove search.js
- **WHEN** the implementation removes `src/framework/utils/search.js`
- **THEN** the file SHALL no longer exist
- **THEN** no import statement references `search.js`
