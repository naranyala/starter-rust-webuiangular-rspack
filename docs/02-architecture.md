# Architecture

## Project Structure

```
starter-rust-webuivanilla-rspack/
├── Cargo.lock                        # Locked dependency versions
├── Cargo.toml                        # Rust project manifest
├── app.config.toml                   # Application configuration
├── app.db                            # SQLite database file
├── application.log                   # Runtime log file
├── build-dist.sh                     # Distribution builder
├── build-frontend.js                 # Frontend build orchestration
├── build.rs                          # Rust build script
├── docs/                             # Documentation directory
├── examples/                         # Example implementations
├── frontend/                         # Vanilla JavaScript frontend
│   ├── src/                          # Frontend source code
│   ├── static/                       # Static assets
│   ├── dist/                         # Build output
│   ├── index.html                    # HTML template
│   ├── package.json                  # Node.js dependencies
│   ├── rspack.config.ts              # Rspack configuration
│   └── tsconfig.json                 # TypeScript configuration
├── frontend-origin/                  # Original frontend template
├── post-build.sh                     # Post-build processing
├── run.sh                            # Master build/run script
├── src/                              # Rust backend source
│   ├── application/                  # Business logic (MVVM Application layer)
│   ├── domain/                       # Entities (MVVM Domain layer)
│   ├── infrastructure/               # Services (MVVM Infrastructure layer)
│   ├── presentation/                 # UI handlers (MVVM Presentation layer)
│   ├── shared/                       # Shared utilities
│   └── main.rs                       # Application entry point
├── static/                           # Runtime static files
│   ├── css/                          # Compiled CSS
│   └── js/                           # Compiled JavaScript
├── target/                           # Rust build output
├── thirdparty/                       # Third-party dependencies
├── .gitignore                        # Git ignore rules
├── index.html                        # Root HTML file
└── test.html                         # Test HTML file
```

## Backend (Rust) Architecture

The backend follows the MVVM (Model-View-ViewModel) architecture pattern with clear separation of concerns:

### Domain Layer (src/domain/)

Contains business entities and domain logic abstractions.

- **entities/**: Core data models representing business concepts
- **traits/**: Domain interfaces and contracts defining behavior

### Application Layer (src/application/)

Implements business use cases and application services.

- **handlers/**: Request handlers for different features
- Business logic orchestration
- Use case implementations

### Infrastructure Layer (src/infrastructure/)

Handles external concerns and technical implementations.

- **config/**: Configuration modules for application settings
- **logging/**: Logging system implementation
- **persistence/**: Data persistence and database access
- **web/**: Web-related modules
- **config.rs**: Configuration loading and management
- **database.rs**: SQLite database abstraction layer
- **di.rs**: Dependency injection container
- **event_bus.rs**: Event bus for pub/sub messaging
- **logging.rs**: Logging system configuration

### Presentation Layer (src/presentation/)

Manages UI handlers and presentation logic.

- **webui/**: WebUI-specific presentation components
- Event handlers for frontend interactions
- UI state management

### Shared Utilities (src/shared/)

Common modules used across layers:

- Compression utilities
- Cryptography functions
- Encoding/decoding
- File operations
- Network utilities
- Security utilities
- System information
- Validation utilities

## Frontend Architecture

The frontend uses a modern build pipeline with modular organization:

### Source Code Organization

- **src/lib/**: Core JavaScript utilities and helpers
- **src/styles/**: CSS stylesheets organized by component
- **src/types/**: TypeScript type definitions
- **src/services/**: Frontend services and API clients
- **src/App.ts**: Root application component

### Build System

- **Rspack**: Fast bundler for production builds
- **Bun**: Package management and runtime
- **TypeScript**: Type safety and modern JavaScript features

### Asset Pipeline

- Source assets in `frontend/src/`
- Compiled to `frontend/dist/`
- Copied to root `static/` for runtime access
- Served to embedded WebView

## MVVM Pattern Implementation

### Model (Domain Layer)

- Data structures and entities
- Business rules and validation
- State management

### ViewModel (Application Layer)

- Business logic orchestration
- Data transformation for view
- Command handling

### View (Presentation Layer)

- UI components and handlers
- User interaction handling
- Display logic

## Communication Flow

```
┌─────────────┐                          ┌─────────────┐
│  Frontend   │                          │   Backend   │
│ (JavaScript)│                          │    (Rust)   │
└──────┬──────┘                          └──────┬──────┘
       │                                        │
       │  1. Event triggered (JSON payload)     │
       │────────────────────────────────────────>
       │                                        │
       │  2. Process in Rust (deserialize)      │
       │                                        │
       │  3. Response (JSON via dispatchEvent)  │
       │<───────────────────────────────────────│
       │                                        │
       │  4. Frontend receives via eventListener│
       │                                        │
```

## Dependency Injection

The application uses a dependency injection container for:

- Service registration and resolution
- Singleton pattern management
- Testability through dependency injection
- Loose coupling between components

## Event Bus

Pub/sub messaging system for:

- Decoupled component communication
- Event-driven architecture support
- Cross-module messaging
- Event history and tracking
