## ADDED Requirements

### Requirement: ProcessEngine SHALL load process definitions
The system SHALL provide a ProcessEngine class that accepts a process definition object containing states, transitions, and hooks.

#### Scenario: Load process definition
- **WHEN** `processEngine.loadProcess({ id: "task-review", states: [...], transitions: [...], hooks: {...} })` is called
- **THEN** the definition is stored and ready for state queries and transitions

### Requirement: ProcessEngine SHALL query next valid states
The system SHALL return the list of valid target states from a given current state, based on the loaded process definition's transitions.

#### Scenario: Get next states from current state
- **WHEN** `processEngine.getNextStates("draft")` is called for a process with transitions `[{ from: "draft", to: "pending_review" }, { from: "draft", to: "cancelled" }]`
- **THEN** it returns `["pending_review", "cancelled"]`

#### Scenario: Empty result for final states
- **WHEN** `processEngine.getNextStates("approved")` is called and no transitions originate from "approved"
- **THEN** it returns `[]`

### Requirement: ProcessEngine SHALL execute state transitions
The system SHALL validate and execute a transition from one state to another, running condition checks and lifecycle hooks.

#### Scenario: Valid transition succeeds
- **WHEN** `processEngine.transition(record, "draft", "pending_review", { userId: "user-1" })` is called and the transition is defined
- **THEN** it returns a new state record with `from: "draft"`, `to: "pending_review"`, `at: <timestamp>`, and `by: "user-1"`

#### Scenario: Invalid transition returns error
- **WHEN** `processEngine.transition(record, "draft", "approved")` is called but no direct draft→approved transition exists
- **THEN** it returns `{ error: "Invalid transition" }` or throws

### Requirement: ProcessEngine SHALL support lifecycle hooks
The system SHALL invoke onEnter, onLeave, and onTransition hooks defined in the process definition during transitions.

#### Scenario: onEnter hook fires on transition
- **WHEN** transitioning to a state that has `onEnter: { action: "notify", target: "reviewers" }`
- **THEN** the hook function is invoked with context data

### Requirement: ProcessEngine SHALL NOT store process definitions
The system SHALL only consume process definitions passed to it. Storage of definitions is the caller's responsibility.

#### Scenario: Engine stateless after reload
- **WHEN** a new `loadProcess()` call is made
- **THEN** the previous definition is replaced without persisting to disk
