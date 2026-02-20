# Rust WebUI + Angular + Rspack Starter

Build desktop-class software with a modern web UI, a high-performance Rust core, and a codebase designed to scale from prototype to production.

## Quick Start

```bash
# From repository root
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

## Documentation

### Core Documentation

- [01 - Introduction](docs/01-introduction.md) - Project overview, technology stack, and use cases
- [02 - Architecture](docs/02-architecture.md) - Backend and frontend architecture details
- [03 - Build System](docs/03-build-system.md) - Build pipeline, configuration, and troubleshooting
- [04 - Communication](docs/04-communication.md) - Frontend-backend communication patterns
- [05 - Dependencies](docs/05-dependencies.md) - Complete dependency reference
- [06 - Improvements](docs/06-improvements.md) - Suggested enhancements and priority matrix
- [07 - Getting Started](docs/07-getting-started.md) - Installation and development guide
- [08 - Project Structure](docs/08-project-structure.md) - Repository layout explanation
- [09 - Errors as Values](docs/09-errors-as-values.md) - Error handling pattern guide

### Technology Stack

**Backend:** Rust, WebUI integration, SQLite (rusqlite), serialization stack (serde)

**Frontend:** Angular 19, TypeScript, WinBox windowing integration

**Build:** Cargo, Angular CLI, Bun/Rspack support scripts

**Runtime:** Static asset serving (static/js, static/css), desktop binary, local DB/log files

### Repository Structure

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
+-- dist/                   # Distribution output
+-- target/                 # Cargo build output
+-- docs/                   # Documentation
```

See [Project Structure](docs/08-project-structure.md) for complete directory layout.

### Key Features

- MVVM architecture pattern on both backend and frontend
- Bidirectional frontend-backend communication via WebUI bindings
- Embedded SQLite database with structured error handling
- Comprehensive logging system with multiple sinks
- Configuration management via TOML
- Cross-platform support (Windows, macOS, Linux)
- Production-ready build pipeline
- Event-driven architecture with pub/sub messaging
- "Errors as Values" pattern for type-safe error handling

### License

MIT License.
