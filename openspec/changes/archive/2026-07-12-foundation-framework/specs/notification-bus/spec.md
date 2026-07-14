## ADDED Requirements

### Requirement: NotificationBus SHALL provide four severity levels
The system SHALL provide a NotificationBus class with success, error, warning, and info notification methods. Each notification SHALL display as a colored toast with auto-dismiss.

#### Scenario: Success notification displays
- **WHEN** code calls `notificationBus.success("Saved")`
- **THEN** a green toast appears with text "Saved" and auto-dismisses after 3 seconds

#### Scenario: Error notification displays
- **WHEN** code calls `notificationBus.error("Failed")`
- **THEN** a red toast appears with text "Failed"

#### Scenario: Warning notification displays
- **WHEN** code calls `notificationBus.warning("Low disk")`
- **THEN** a yellow toast appears with text "Low disk"

#### Scenario: Info notification displays
- **WHEN** code calls `notificationBus.info("Processing")`
- **THEN** a blue toast appears with text "Processing"

### Requirement: NotificationBus SHALL support event subscription
The system SHALL allow modules to subscribe to notification events via `on(type, fn)` for cross-module coordination.

#### Scenario: Subscribe to a notification type
- **WHEN** a module calls `notificationBus.on("success", handler)`
- **THEN** handler is invoked on subsequent `notificationBus.success()` calls

#### Scenario: Unsubscribe returns cleanup function
- **WHEN** `on()` is called
- **THEN** it returns an `off()` function that removes the listener

### Requirement: NotificationBus SHALL be the first module initialized
The system SHALL initialize NotificationBus before all other modules to ensure error handling is available from boot.

#### Scenario: NotificationBus available during boot
- **WHEN** `app.js` starts initialization
- **THEN** NotificationBus is constructed before SchemaRegistry
