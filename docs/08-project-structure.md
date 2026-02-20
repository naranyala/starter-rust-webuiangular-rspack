# Project Structure

## Repository Layout

```
.
+-- src/                    # Active Rust application (main entry)
+-- frontend/               # Active Angular workspace (MVVM)
+-- core/                   # Reusable backend/frontend core packages
+-- plugins/                # Plugin extension area
+-- apps/                   # Application entrypoint crates
+-- shared/                 # Shared protocol/type boundaries
+-- config/                 # Runtime configuration
+-- static/                 # Runtime static JS/CSS assets
+-- frontend-origin/        # Historical frontend reference
+-- frontend/src-origin/    # Pre-MVVM frontend snapshot
+-- thirdparty/             # Vendored upstream sources
+-- dist/                   # Distribution output
+-- target/                 # Cargo build output
+-- docs/                   # Documentation
+-- .gitignore              # Git ignore rules
+-- Cargo.toml              # Rust project manifest
+-- Cargo.lock              # Locked dependency versions
+-- build.rs                # Rust build script
+-- run.sh                  # Master build/run script
+-- build-dist.sh           # Distribution builder
+-- build-frontend.js       # Frontend build orchestration
+-- post-build.sh           # Post-build processing
+-- app.config.toml         # Application configuration
+-- app.db                  # SQLite database file
+-- application.log         # Runtime log file
+-- README.md               # This file (table of contents)
```

## Rust Backend: src/

### Entrypoint

- src/main.rs: Application bootstrap and runtime startup

### Core Architecture (src/core/)

This follows a layered model (Domain-Driven Design inspired):

- src/core/domain/: Domain entities and domain-level traits
- src/core/application/: Use-case orchestration and app handlers
  - src/core/application/handlers/: Focused handler modules (UI, DB, API, sysinfo, window_state)
- src/core/infrastructure/: Concrete implementations and external integrations
  - src/core/infrastructure/database/: Connection, models, user persistence
  - src/core/infrastructure/logging/: Logger config, formatter, and output behavior
  - src/core/infrastructure/config.rs: Config loading
  - src/core/infrastructure/di.rs: Dependency wiring
  - src/core/infrastructure/event_bus.rs: Backend event dispatch plumbing
- src/core/presentation/: Presentation boundary
  - src/core/presentation/webui/: WebUI-facing handlers and bridge surface
- src/core/error.rs: Centralized error types

### Utilities (src/utils/)

- compression/: Compression utilities
- crypto/: Cryptography functions
- encoding/: Encoding/decoding
- file_ops/: File operations
- network/: Network utilities
- security/: Security utilities
- serialization/: Serialization helpers
- system/: System information
- validation/: Validation utilities

These modules keep infrastructure-level helper logic out of business layers.

## Frontend App: frontend/ (MVVM Pattern)

### Primary Runtime Source (frontend/src/)

```
frontend/src/
+-- main.ts                    # Angular bootstrap and global startup wiring
+-- winbox-loader.ts           # WinBox runtime loader
+-- environments/              # Environment configs (dev/prod)
+-- types/                     # TypeScript declarations
+-- polyfills.ts               # Angular polyfills
+-- test.ts                    # Test configuration
|
+-- models/                    # M - Data interfaces and types
|   +-- index.ts               # Barrel export
|   +-- card.model.ts          # Card entity interfaces
|   +-- window.model.ts        # Window state interfaces
|   +-- log.model.ts           # Logging interfaces
|   +-- error.model.ts         # Error handling types
|   +-- api.model.ts           # API client types
|
+-- viewmodels/                # VM - Business logic and state management
|   +-- index.ts               # Barrel export
|   +-- logging.viewmodel.ts   # Logging backend service
|   +-- logger.ts              # Logger facade API
|   +-- event-bus.viewmodel.ts # Event bus implementation
|   +-- window-state.viewmodel.ts # Window state management
|   +-- api-client.ts          # Backend API client
|
+-- views/                     # V - Angular components
|   +-- app.component.ts       # Main shell component
|   +-- app.module.ts          # Angular module
|   +-- app-routing.module.ts  # Routing configuration
|   +-- home/
|   |   +-- home.component.ts
|   +-- demo/
|   |   +-- demo.component.ts
|   |   +-- error-handling-demo.component.ts
|   +-- shared/
|       +-- error-modal.component.ts
|
+-- core/                      # Shared infrastructure
    +-- index.ts
    +-- global-error.service.ts
    +-- global-error.handler.ts
    +-- errors/
        +-- result.ts
```

### MVVM Pattern Explanation

**Models (models/):**
- Pure data interfaces and type definitions
- No business logic, only data shape contracts
- Examples: Card, WindowEntry, LogEntry

**ViewModels (viewmodels/):**
- Business logic and state management services
- Angular services decorated with @Injectable
- Handle data transformation, state, and communication
- Examples: LoggingViewModel, EventBusViewModel, WindowStateViewModel

**Views (views/):**
- Angular components (presentation layer)
- Handle UI rendering and user interaction
- Consume ViewModels via dependency injection
- Examples: AppComponent, DemoComponent, HomeComponent

**Core (core/):**
- Cross-cutting concerns
- Error handling infrastructure
- Shared utilities that don't fit in other layers

### Frontend Tooling and Build Config

- frontend/package.json: Scripts and dependencies
- frontend/angular.json: Angular build/serve configuration
- frontend/tsconfig.json, frontend/tsconfig.app.json, frontend/tsconfig.spec.json: TypeScript configs
- frontend/biome.json: Lint/format policy
- frontend/e2e/: End-to-end testing config

### Frontend Generated Directories

- frontend/dist/: Compiled frontend output
- frontend/.angular/: Angular cache
- frontend/node_modules/: Installed JS dependencies

## Core Packages: core/

### core/backend/

A reusable Rust backend core library with its own layered architecture:

- core/backend/src/lib.rs: Package entrypoint
- core/backend/src/domain/, application/, infrastructure/, presentation/
- core/backend/src/error/: Normalized error model and handler abstractions
- core/backend/src/plugin/: Plugin context, metadata, registry, and traits

### core/frontend/

A reusable TypeScript frontend core package:

- core/frontend/src/core/models.ts: Common model primitives
- core/frontend/src/core/viewmodel.ts: Viewmodel base behavior
- core/frontend/src/core/events.ts: Core event bus utility
- core/frontend/src/core/plugin.ts: Plugin abstractions
- core/frontend/src/core/service.ts: Service base patterns
- core/frontend/src/error/: Frontend error value model
- core/frontend/src/index.ts: Package export surface

## Plugins: plugins/

- plugins/backend/plugin-database/: Backend plugin example
  - Cargo.toml, plugin.json, src/lib.rs
- plugins/frontend/: Frontend plugin extension area scaffold

## Application Entrypoints: apps/

- apps/desktop/: Desktop application wrapper crate
  - apps/desktop/Cargo.toml
  - apps/desktop/src/main.rs

## Shared Contracts: shared/

- shared/protocol/: Cross-boundary protocol scaffolding
- shared/types/: Shared type contract scaffolding

## Configuration: config/

- config/app.config.toml: Runtime configuration source

Typical configuration domains include app metadata, window behavior, database settings, and logging options.

## Runtime Static Assets: static/

- static/js/: Runtime JavaScript assets (including WebUI bridge files)
- static/css/: Runtime stylesheets

These assets are consumed by runtime HTML and desktop WebUI rendering.

## Legacy Frontend Snapshots

### frontend-origin/

Historical frontend implementation retained for migration safety and comparison:

- Independent source tree
- Standalone configs
- Historical event bus and bridge experiments

### frontend/src-origin/

Pre-MVVM restructuring snapshot kept for reference during transition.

## Vendor Sources: thirdparty/

- thirdparty/webui-c-src/: Vendored WebUI C source and examples

## Build Output Directories

### target/

Cargo build output:
- target/debug/: Debug builds
- target/release/: Release builds
- target/debug/app: Debug executable
- target/release/app: Release executable

### dist/

Distribution output:
- dist/index.html: Main HTML file
- dist/static/js/: Compiled JavaScript
- dist/static/css/: Compiled CSS

## Documentation: docs/

- 01-introduction.md: Project overview
- 02-architecture.md: Architecture details
- 03-build-system.md: Build instructions
- 04-communication.md: Communication patterns
- 05-dependencies.md: Dependency reference
- 06-improvements.md: Suggested enhancements
- 07-getting-started.md: Getting started guide
- 08-project-structure.md: This file
- 09-errors-as-values.md: Error handling guide
- ERRORS_AS_VALUES.md: Legacy error handling doc
- ARCHITECTURE.md: Legacy architecture doc
- PROJECT_STRUCTURE.md: Legacy structure doc
