# Architecture

## Overview

The application follows a layered architecture inspired by Domain-Driven Design on the backend and MVVM pattern on the frontend.

## Backend Architecture (Rust)

The backend is organized into four main layers:

### Domain Layer (src/core/domain/)

Contains business entities and domain logic abstractions.

- **entities/**: Core data models representing business concepts
- **traits/**: Domain interfaces and contracts defining behavior

### Application Layer (src/core/application/)

Implements business use cases and application services.

- **handlers/**: Request handlers for different features
  - UI handlers
  - Database handlers
  - API handlers
  - System info handlers
  - Window state handlers
- Business logic orchestration
- Use case implementations

### Infrastructure Layer (src/core/infrastructure/)

Handles external concerns and technical implementations.

- **database/**: SQLite database connection and operations
  - connection.rs: Database connection management
  - models.rs: Database models and schemas
  - users.rs: User-specific database operations
- **logging/**: Logging system implementation
  - config.rs: Logging configuration
  - formatter.rs: Log message formatting
- **config.rs**: Configuration loading and management
- **di.rs**: Dependency injection container
- **event_bus.rs**: Event bus for pub/sub messaging

### Presentation Layer (src/core/presentation/)

Manages UI handlers and presentation logic.

- **webui/**: WebUI-specific presentation components
  - handlers/: Event handlers for frontend interactions
    - db_handlers.rs: Database operation handlers
    - sysinfo_handlers.rs: System information handlers
    - logging_handlers.rs: Logging handlers
    - event_bus_handlers.rs: Event bus handlers
    - window_state_handler.rs: Window state management
    - ui_handlers.rs: General UI handlers

### Utilities (src/utils/)

Common modules used across layers:

- compression/: Compression utilities
- crypto/: Cryptography functions
- encoding/: Encoding/decoding utilities
- file_ops/: File operations
- network/: Network utilities
- security/: Security utilities
- serialization/: Serialization helpers
- system/: System information utilities
- validation/: Validation utilities

## Frontend Architecture (Angular)

The frontend follows the MVVM pattern:

### Models (frontend/src/models/)

Pure data interfaces and type definitions.

- card.model.ts: Card entity interfaces
- window.model.ts: Window state interfaces
- log.model.ts: Logging interfaces
- error.model.ts: Error handling types
- api.model.ts: API client types

### ViewModels (frontend/src/viewmodels/)

Business logic and state management services.

- logging.viewmodel.ts: Logging backend service
- logger.ts: Logger facade API
- event-bus.viewmodel.ts: Event bus implementation
- window-state.viewmodel.ts: Window state management
- api-client.ts: Backend API client

### Views (frontend/src/views/)

Angular components (presentation layer).

- app.component.ts: Main shell component
- app.module.ts: Angular module
- app-routing.module.ts: Routing configuration
- home/: Home page components
- demo/: Demo components
- shared/: Shared components
  - error-modal.component.ts: Error display component

### Core (frontend/src/core/)

Cross-cutting concerns and shared infrastructure.

- global-error.service.ts: Centralized error handling
- global-error.handler.ts: Global error handler
- errors/: Error handling utilities
  - result.ts: Result type implementation
- base/: Base classes and utilities
- plugins/: Plugin abstractions

## Communication Flow

```
+---------------+                          +---------------+
|   Frontend    |                          |    Backend    |
|   (Angular)   |                          |     (Rust)    |
+-------+-------+                          +-------+-------+
        |                                          |
        |  1. Event triggered (JSON payload)       |
        |----------------------------------------->|
        |                                          |
        |  2. Process in Rust (deserialize)        |
        |                                          |
        |  3. Response (JSON via dispatchEvent)    |
        |<-----------------------------------------|
        |                                          |
        |  4. Frontend receives via eventListener  |
        |                                          |
```

## Dependency Injection

The application uses a dependency injection container for:

- Service registration and resolution
- Singleton pattern management
- Testability through dependency injection
- Loose coupling between components

### Container Usage

```rust
// Initialize container
di::init_container()?;
let container = di::get_container();

// Register services
container.register_singleton(config)?;
container.register_singleton(database)?;

// Resolve services
let config: AppConfig = container.resolve()?;
```

## Event Bus

Pub/sub messaging system for:

- Decoupled component communication
- Event-driven architecture support
- Cross-module messaging
- Event history and tracking

### Backend Event Bus

```rust
use crate::infrastructure::event_bus::GLOBAL_EVENT_BUS;

// Publish event
GLOBAL_EVENT_BUS.emit("user.created", json!({
    "user_id": 123,
    "name": "John Doe"
}));

// Get history
let events = GLOBAL_EVENT_BUS.get_history(Some("user.created"), Some(10))?;
```

### Frontend Event Bus

```typescript
// Publish
this.eventBus.publish('user.updated', { id: 123 });

// Subscribe
const unsubscribe = this.eventBus.subscribe('user.updated', (payload) => {
    console.log('User updated:', payload);
});
```

## Error Handling

The application implements the "Errors as Values" pattern:

- Structured error types with codes and context
- Result types for explicit error handling
- Cross-boundary error serialization
- User-friendly error display

See [Errors as Values Guide](09-errors-as-values.md) for details.

## Configuration System

Configuration is loaded from TOML files:

- app.config.toml: Main configuration file
- config/app.config.toml: Alternative location

### Configuration Sections

- [app]: Application metadata
- [window]: Window behavior settings
- [database]: Database configuration
- [logging]: Logging settings
- [features]: Feature flags

See [Build System](03-build-system.md) for configuration details.
