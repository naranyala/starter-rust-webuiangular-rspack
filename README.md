# Rust WebUI + Angular + Rspack Starter

Build desktop-class software with a modern web UI, a high-performance Rust core, and a codebase designed to scale from prototype to production.

## Quick Start

```bash
./run.sh
```

Common workflows:

```bash
./run.sh --build            # Build frontend + backend
./run.sh --build-frontend   # Build frontend only
./run.sh --build-rust       # Build backend only
./run.sh --release          # Release build
./run.sh --run              # Run existing build
./run.sh --clean            # Clean artifacts
./run.sh --rebuild          # Clean + rebuild
```

## Technology Stack

**Backend:** Rust (Edition 2024), WebUI, SQLite (rusqlite), serde serialization stack

**Frontend:** Angular 19, TypeScript, Rspack bundler, WinBox windowing

**Build:** Cargo, Bun, Angular CLI, Rspack

**Runtime:** Static asset serving, desktop binary, SQLite database, logging

## Project Structure

```
starter-rust-webuiangular-rspack/
|
+-- Cargo.toml                          # Rust package manifest
+-- Cargo.lock                          # Dependency lock file
+-- build.rs                            # Cargo build script
+-- build-frontend.js                   # Frontend build orchestration
+-- build-dist.sh                       # Distribution build script
+-- run.sh                              # Development/run script
+-- post-build.sh                       # Post-build operations
+-- README.md                           # This file
|
+-- src/                                # Rust application source
|   +-- main.rs                        # Application entry point
|   +-- utils_demo.rs                  # Utility demonstrations
|   +-- mod.rs                         # Root module
|   +-- error.rs                       # Error handling utilities
|   |
|   +-- core/                          # Clean Architecture layers
|   |   +-- mod.rs
|   |   |
|   |   +-- application/               # Application layer (use cases)
|   |   |   +-- mod.rs
|   |   |   +-- handlers/              # Request handlers
|   |   |
|   |   +-- domain/                    # Domain layer (business logic)
|   |   |   +-- mod.rs
|   |   |   +-- entities/              # Domain entities
|   |   |   +-- traits/                # Domain traits
|   |   |
|   |   +-- infrastructure/            # Infrastructure layer
|   |   |   +-- mod.rs
|   |   |   +-- config.rs              # Configuration management
|   |   |   +-- di.rs                  # Dependency injection
|   |   |   +-- event_bus.rs           # Event bus implementation
|   |   |   +-- database/              # Database layer
|   |   |   |   +-- mod.rs
|   |   |   |   +-- connection.rs      # DB connection management
|   |   |   |   +-- models.rs          # DB models
|   |   |   |   +-- users.rs           # User repository
|   |   |   |
|   |   |   +-- logging/              # Logging infrastructure
|   |   |       +-- mod.rs
|   |   |       +-- config.rs         # Logging configuration
|   |   |       +-- formatter.rs      # Log formatting
|   |   |       +-- logger.rs         # Logger implementation
|   |   |
|   |   +-- presentation/             # Presentation layer
|   |       +-- mod.rs
|   |       +-- webui/                 # WebUI integration
|   |
|   +-- utils/                          # Utility modules
|       +-- mod.rs
|       +-- compression/               # Compression utilities
|       +-- crypto/                    # Cryptography utilities
|       +-- encoding/                  # Encoding utilities
|       +-- file_ops/                  # File operations
|       +-- network/                   # Network utilities
|       +-- security/                  # Security utilities
|       +-- serialization/             # Serialization utilities
|       +-- system/                    # System utilities
|       +-- validation/                 # Validation utilities
|
+-- frontend/                           # Angular frontend (active)
|   +-- angular.json                    # Angular CLI config
|   +-- package.json                    # NPM dependencies
|   +-- tsconfig.json                   # TypeScript config
|   +-- tsconfig.app.json               # App TypeScript config
|   +-- tsconfig.spec.json              # Test TypeScript config
|   +-- rspack.config.js                # Rspack bundler config
|   +-- biome.json                      # Biome linter config
|   +-- karma.conf.js                   # Karma test runner config
|   +-- custom-webpack.config.js        # Custom webpack config
|   +-- README.md                       # Frontend-specific docs
|   +-- RSPACK_SETUP.md                 # Rspack setup guide
|   |
|   +-- src/                            # Frontend source
|       +-- main.ts                    # Angular entry point
|       +-- index.html                 # HTML entry point
|       +-- styles.css                 # Global styles
|       +-- polyfills.ts               # Polyfills
|       +-- test.ts                    # Test setup
|       +-- favicon.ico                # Favicon
|       +-- winbox-loader.ts           # WinBox loader
|       |
|       +-- models/                    # Data models
|       |   +-- index.ts
|       |   +-- api.model.ts
|       |   +-- card.model.ts
|       |   +-- error.model.ts
|       |   +-- log.model.ts
|       |   +-- window.model.ts
|       |
|       +-- types/                     # TypeScript type definitions
|       |   +-- error.types.ts         # Error type definitions
|       |   +-- winbox.d.ts            # WinBox type declarations
|       |
|       +-- viewmodels/                # MVVM ViewModels
|       |   +-- index.ts
|       |   +-- api-client.ts          # API client ViewModel
|       |   +-- event-bus.viewmodel.ts # Event bus ViewModel
|       |   +-- logger.ts              # Logger utilities
|       |   +-- logging.viewmodel.ts   # Logging ViewModel
|       |   +-- window-state.viewmodel.ts # Window state ViewModel
|       |
|       +-- core/                       # Core services
|       |   +-- index.ts
|       |   +-- global-error.handler.ts    # Global error handler
|       |   +-- global-error.service.ts    # Global error service
|       |   +-- winbox.service.ts          # WinBox window service
|       |   |
|       |   +-- base/                 # Base classes
|       |   |   +-- index.ts
|       |   |   +-- service.base.ts    # Base service class
|       |   |   +-- viewmodel.base.ts  # Base ViewModel class
|       |   |
|       |   +-- errors/               # Error handling
|       |   |   +-- index.ts
|       |   |   +-- result.ts         # Result type (Either)
|       |   |
|       |   +-- plugins/              # Plugin system
|       |       +-- plugin.interface.ts    # Plugin interface
|       |       +-- plugin-registry.ts      # Plugin registry
|       |
|       +-- views/                     # Angular components
|       |   +-- app.component.ts       # Root component
|       |   +-- app.component.html     # Root template
|       |   +-- app.component.css       # Root styles
|       |   +-- app.module.ts          # Root module
|       |   +-- app-routing.module.ts  # Routing config
|       |   |
|       |   +-- home/                  # Home feature
|       |   |   +-- home.component.ts
|       |   |   +-- home.component.spec.ts
|       |   |
|       |   +-- demo/                  # Demo feature
|       |   |   +-- demo.component.ts
|       |   |   +-- error-handling-demo.component.ts
|       |   |
|       |   +-- shared/                # Shared components
|       |       +-- error-modal.component.ts
|       |
|       +-- assets/                     # Static assets
|       |
|       +-- environments/               # Environment configs
|       |
|       +-- docs/                       # Frontend documentation
|       |
|       +-- e2e/                        # End-to-end tests
|       |
|       +-- dist/                       # Build output
|       |
|       +-- node_modules/               # NPM packages
|       |
|       +-- .angular/                   # Angular CLI cache
|
+-- frontend-backup/                    # Backup of previous frontend
|   +-- [similar structure to frontend]
|   +-- src/
|       +-- [similar to frontend/src]
|       +-- core/
|       |   +-- global-error.handler.ts
|       |   +-- global-error.service.ts
|       |   +-- winbox.service.ts
|       |   +-- errors/
|       |   +-- plugins/
|       |   +-- base/
|       +-- views/
|       |   +-- app.component.*
|       |   +-- demo/
|       |   +-- shared/
|       +-- viewmodels/
|       +-- models/
|       +-- types/
|
+-- thirdparty/                        # Third-party dependencies
|   +-- webui-c-src/                   # WebUI C library source
|       +-- src/
|       |   +-- webui.c               # Main WebUI C implementation
|       |   +-- webview/              # WebView implementations
|       |   +-- civetweb/             # Embedded web server
|       +-- include/                   # C headers
|       +-- LICENSE
|       +-- Makefile
|
+-- config/                            # Runtime configuration
|   +-- app.config.toml               # Application config
|
+-- static/                            # Static runtime assets
|   +-- js/                           # JavaScript files
|   +-- css/                         # CSS files
|
+-- dist/                              # Distribution output
|
+-- docs/                              # Project documentation
|   +-- 01-introduction.md            # Project overview
|   +-- 02-architecture.md            # Architecture details
|   +-- 03-build-system.md            # Build pipeline
|   +-- 04-communication.md           # Frontend-backend communication
|   +-- 05-dependencies.md            # Dependency reference
|   +-- 06-improvements.md            # Suggested enhancements
|   +-- 07-getting-started.md        # Installation guide
|   +-- 08-project-structure.md       # Detailed structure
|   +-- 09-errors-as-values.md        # Error handling patterns
|
+-- target/                            # Cargo build output
|
+-- .git/                             # Git repository
+-- .gitignore                        # Git ignore rules
+-- app.db                            # SQLite database (runtime)
+-- application.log                   # Application log file
```

## Architecture Overview

### Backend (Rust)

The backend follows **Clean Architecture** with four distinct layers:

1. **Domain Layer** (`src/core/domain/`) - Business entities and traits
2. **Application Layer** (`src/core/application/`) - Use cases and handlers
3. **Infrastructure Layer** (`src/core/infrastructure/`) - External concerns (DB, logging, config)
4. **Presentation Layer** (`src/core/presentation/`) - WebUI integration

### Frontend (Angular)

The frontend follows **MVVM (Model-View-ViewModel)** pattern:

- **Models** (`src/models/`) - Data structures
- **Views** (`src/views/`) - Angular components
- **ViewModels** (`src/viewmodels/`) - Business logic and state management
- **Core Services** (`src/core/`) - Shared services and base classes

### Communication

Frontend-backend communication uses **WebUI bindings** for bidirectional IPC. The project implements an **event-driven architecture** with a pub/sub messaging system via the event bus.

## Key Features

- MVVM architecture pattern on both backend and frontend
- Bidirectional frontend-backend communication via WebUI bindings
- Embedded SQLite database with structured error handling
- Comprehensive logging system with multiple sinks
- Configuration management via TOML
- Cross-platform support (Windows, macOS, Linux)
- Production-ready build pipeline
- Event-driven architecture with pub/sub messaging
- "Errors as Values" pattern for type-safe error handling
- Plugin system for extensibility
- Rspack bundler for fast frontend builds

## Documentation

- [01 - Introduction](docs/01-introduction.md) - Project overview and use cases
- [02 - Architecture](docs/02-architecture.md) - Backend and frontend architecture
- [03 - Build System](docs/03-build-system.md) - Build pipeline and configuration
- [04 - Communication](docs/04-communication.md) - Frontend-backend communication
- [05 - Dependencies](docs/05-dependencies.md) - Complete dependency reference
- [06 - Improvements](docs/06-improvements.md) - Suggested enhancements
- [07 - Getting Started](docs/07-getting-started.md) - Installation and development
- [08 - Project Structure](docs/08-project-structure.md) - Detailed layout
- [09 - Errors as Values](docs/09-errors-as-values.md) - Error handling patterns

## Potential Improvements

### Project Structure

1. **Consolidate Frontend directories**: The presence of both `frontend/` and `frontend-backup/` creates confusion and maintenance burden. Consider either:
   - Removing `frontend-backup/` entirely after migration is complete
   - Moving it to a separate backup repository or archive

2. **Separate build artifacts from source**: The `dist/` directory at root contains build output but is tracked in the repository. Add `dist/` to `.gitignore` and use a separate `release/` or `output/` directory for distribution builds.

3. **Consolidate static asset handling**: The project has `static/` at root level and `frontend/dist/` for built assets. Consider a single approach:
   - Either serve directly from `frontend/dist/`
   - Or have a dedicated `assets/` directory that gets copied to output

4. **Move documentation to standard location**: Consider moving some inline documentation from `docs/` folder to README files within each major directory (e.g., `frontend/README.md`, `src/README.md`) for better discoverability.

5. **Create workspace structure**: If the project grows, consider using Cargo workspace to organize `src/` as a crate and potentially create separate crates for reusable modules.

6. **Extract utility modules**: The `src/utils/` directory contains many modules. Consider whether some of these could be:
   - Separated into their own crates for reuse
   - Or clearly marked as application-specific utilities

7. **Review thirdparty integration**: The `thirdparty/webui-c-src/` is included directly. Consider:
   - Using it as a git submodule
   - Or depending on a published WebUI crate instead of vendoring

8. **Add integration test structure**: Currently lacks a dedicated `tests/` directory at the Rust level for integration tests. Consider adding:
   ```
   src/
   tests/
       integration/
       api/
   ```

9. **Environment configuration**: Add a `.env.example` file and environment-specific config handling for development vs production.

10. **CI/CD configuration**: Add CI/CD pipeline configuration (e.g., `.github/workflows/`, `.gitlab-ci.yml`) for automated builds and tests.

### Build and Configuration

11. **Reduce dependency footprint**: Review `Cargo.toml` for unused dependencies. Several dependencies may be included but not actively used (e.g., multiple compression algorithms, various serialization formats).

12. **Unified configuration**: Consider consolidating Angular configuration files that are duplicated between `frontend/` and `frontend-backup/`.

13. **Cache optimization**: Add `.angular/` and `node_modules/` to proper cache directories in CI/CD rather than committing cache configurations.

## License

MIT License
