# Rust WebUI + Angular + Rspack Starter

This repository is a full-stack desktop application starter that combines Rust for backend capability with an Angular frontend rendered through WebUI. It is designed for teams that want native-level performance, web-grade UI velocity, and a project layout that scales from prototype to production.

## What This Project Gives You

- A Rust backend with clear architectural boundaries (domain, application, infrastructure, presentation).
- An Angular 19 frontend configured for modern build workflows.
- A WebUI integration path for shipping desktop UX without Electron-level runtime overhead.
- Scripted build orchestration for frontend, backend, and distribution.
- Plugin and shared-module scaffolding for extensibility.

## Technology Stack

- Backend: Rust, `webui-rs`, `rusqlite`, `serde`, `log` ecosystem
- Frontend: Angular 19, TypeScript, WinBox integration
- Build Tooling: Cargo, Bun, Rspack, Angular CLI
- Runtime Artifacts: static JS/CSS assets, compiled binaries, SQLite DB, log files

## Quick Start

```bash
# From repository root
./run.sh
```

Common commands:

```bash
./run.sh --build            # Build frontend + backend
./run.sh --build-frontend   # Build frontend only
./run.sh --build-rust       # Build backend only
./run.sh --release          # Release build
./run.sh --run              # Run existing build
./run.sh --clean            # Clean build artifacts
./run.sh --rebuild          # Clean + rebuild
```

## Repository Structure (Complete Guide)

The list below explains every top-level piece currently in the repository and how each part contributes to delivery.

### Root Files

- `Cargo.toml`: Root Rust package manifest and dependency graph.
- `Cargo.lock`: Locked Rust dependency versions for reproducible builds.
- `README.md`: Project overview and structure guide (this file).
- `build.rs`: Cargo build script for build-time operations.
- `build-frontend.js`: Frontend pipeline orchestrator (build, asset copy, `dist/index.html` generation).
- `build-dist.sh`: Distribution packaging script.
- `post-build.sh`: Post-build binary rename and packaging hygiene script.
- `run.sh`: Main developer entrypoint for build/run workflows.
- `index.html`: Root host HTML used by runtime/build flows.
- `test.html`: Manual test/debug HTML page.
- `.gitignore`: Git ignore rules.

### Runtime Data at Root

- `app.db`: SQLite database file created/used by the app.
- `application.log`: Runtime log output file.

### Top-Level Directories

- `src/`: Active Rust application source used by the root Cargo package.
- `frontend/`: Active Angular frontend workspace.
- `static/`: Runtime-served static assets (`js/`, `css/`).
- `config/`: App configuration (`app.config.toml`).
- `docs/`: Architecture, build, and implementation documentation.
- `core/`: Shared/core crates and frontend core library workspace.
- `plugins/`: Backend plugin implementation area and frontend plugin scaffold.
- `apps/`: App entrypoint projects (desktop launcher crate).
- `shared/`: Shared protocol/type boundaries for multi-module evolution.
- `frontend-origin/`: Legacy/original frontend snapshot kept for reference/migration.
- `thirdparty/`: Vendored third-party sources.
- `dist/`: Generated distribution output.
- `target/`: Cargo build output.

## `src/` (Primary Rust Application)

- `src/main.rs`: Application entrypoint.
- `src/core/`: Layered backend architecture.
  - `src/core/domain/`: Core business entities and traits.
  - `src/core/application/`: Use-case orchestration and handlers.
    - `src/core/application/handlers/`: API, DB, system info, and UI handlers.
  - `src/core/infrastructure/`: External systems and concrete implementations.
    - `src/core/infrastructure/database/`: SQLite connection, models, user data access.
    - `src/core/infrastructure/logging/`: Logger setup, formatters, logging config.
    - `src/core/infrastructure/config.rs`: Configuration loading/management.
    - `src/core/infrastructure/di.rs`: Dependency wiring.
    - `src/core/infrastructure/event_bus.rs`: Event dispatch plumbing.
  - `src/core/presentation/`: Presentation boundary.
    - `src/core/presentation/webui/`: WebUI-facing presentation module.
- `src/utils/`: Utility modules grouped by capability.
  - `compression/`, `crypto/`, `encoding/`, `file_ops/`, `network/`, `security/`, `serialization/`, `system/`, `validation/`.

## `frontend/` (Primary Angular Frontend)

### Frontend App Source

- `frontend/src/main.ts`: Angular bootstrap entrypoint.
- `frontend/src/index.html`: Frontend HTML template for Angular build.
- `frontend/src/styles.css`: Global styles.
- `frontend/src/winbox-loader.ts`: WinBox runtime loader integration.
- `frontend/src/app/`: Angular app shell and feature components.
  - `app.component.ts`: Main shell (sidebar, search, cards, bottom panel).
  - `app-routing.module.ts`: Route definitions.
  - `app.module.ts`: Angular module wiring.
  - `demo/`, `home/`: Additional feature components/specs.
- `frontend/src/environments/`: Environment configs.
- `frontend/src/types/`: Frontend type declarations.
- `frontend/src/assets/`: Static app assets.

### Frontend Tooling and Config

- `frontend/package.json`: Frontend dependencies and scripts.
- `frontend/angular.json`: Angular workspace/build configuration.
- `frontend/rspack.config.js`: Rspack configuration.
- `frontend/biome.json`: Lint/format configuration.
- `frontend/tsconfig*.json`: TypeScript project configs.
- `frontend/karma.conf.js`: Unit test runner config.
- `frontend/e2e/`: End-to-end test configuration/specs.

### Frontend Snapshot and Build Artifacts

- `frontend/src-origin/`: Preserved original Angular source snapshot.
- `frontend/dist/`: Frontend build output.
- `frontend/node_modules/`: Installed frontend dependencies (generated).
- `frontend/.angular/`: Angular build cache (generated).

## `core/` (Reusable Core Packages)

- `core/backend/`: Backend core crate with modularized architecture.
  - `core/backend/src/lib.rs`: Library entrypoint.
  - `core/backend/src/domain/`, `application/`, `infrastructure/`, `presentation/`: Layered backend modules.
  - `core/backend/src/error/`: Dedicated error model, kinds, and handlers.
  - `core/backend/src/plugin/`: Plugin metadata, registry, context, and traits.
- `core/frontend/`: Frontend core package.
  - `core/frontend/src/core/`: Shared frontend models, services, events, plugin interface, viewmodel.
  - `core/frontend/src/error/`: Structured frontend error handling primitives.
  - `core/frontend/src/index.ts`: Frontend core package entrypoint.

## `plugins/` (Extensibility Surface)

- `plugins/backend/plugin-database/`: Example backend plugin crate.
  - `Cargo.toml`, `plugin.json`, `src/lib.rs`.
- `plugins/frontend/`: Frontend plugin area scaffold (currently structure-first).

## `apps/` (Application Entrypoints)

- `apps/desktop/`: Desktop app crate wrapper/launcher.
  - `apps/desktop/Cargo.toml`
  - `apps/desktop/src/main.rs`

## `shared/` (Cross-Boundary Contracts)

- `shared/protocol/`: Protocol-level shared definitions scaffold.
- `shared/types/`: Shared type contracts scaffold.

## `config/`

- `config/app.config.toml`: Central app/runtime settings.
  - App metadata
  - Executable naming
  - Database path/seed behavior
  - Window sizing
  - Logging behavior
  - Feature flags

## `docs/` (Reference Documentation)

The docs directory includes both foundational guides and implementation logs:

- Numbered guides: `01-overview.md` through `07-getting-started.md`
- Architecture/build/dependency deep dives
- Refactor and file-splitting plans and summaries
- Communication, serialization, and plugin architecture notes

## `frontend-origin/` (Legacy Frontend Reference)

Contains an older frontend implementation kept for migration comparison and rollback safety:

- Independent `package.json`, config files, and source tree
- Historical dist/static outputs

## `thirdparty/`

- `thirdparty/webui-c-src/`: Vendored WebUI C source and examples.

## Build and Output Flow

1. Frontend is built in `frontend/`.
2. `build-frontend.js` copies generated JS/CSS into runtime static locations.
3. Rust binary is built via Cargo into `target/`.
4. `post-build.sh` normalizes executable naming.
5. Final runnable assets live across `target/`, `static/`, and `dist/`.

## Why This Structure Works in Public and Production

- Teams can onboard fast because runtime code, core libraries, plugins, and app wrappers are separated early.
- Refactoring is safer because domain/application/infrastructure boundaries are explicit.
- Delivery is faster because frontend and backend build pipelines are scriptable and independently evolvable.
- Expansion is straightforward because `core/`, `plugins/`, `apps/`, and `shared/` are already laid out for scale.

## License

MIT License.
