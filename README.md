# Rust WebUI + Angular + Rspack Starter

Build desktop-class software with a modern web UI, a high-performance Rust core, and a codebase designed to scale from prototype to production.

This repository is not a toy scaffold. It is a structured platform for teams who want:

- Rust reliability and performance in the application core.
- Angular velocity for rich UI and product iteration.
- WebUI-based desktop delivery without heavyweight Electron overhead.
- A layered architecture with clean separation of concerns.
- A growth path for plugins, shared contracts, and multiple app entrypoints.

## Why This Project Is Valuable

Most starter templates optimize for a quick demo. This one optimizes for long-term product delivery.

- It separates domain, application, infrastructure, and presentation on the Rust side.
- It keeps the active frontend and legacy frontend snapshots side-by-side for safe migration.
- It includes build orchestration scripts that connect frontend artifacts, static assets, and Rust binaries.
- It introduces extension points (`core/`, `plugins/`, `shared/`, `apps/`) early, so architecture does not collapse as scope grows.

## Technology Stack

- Backend: Rust, WebUI integration, SQLite (`rusqlite`), serialization stack (`serde`)
- Frontend: Angular 19, TypeScript, WinBox windowing integration
- Build: Cargo, Angular CLI, Bun/Rspack support scripts
- Runtime: static asset serving (`static/js`, `static/css`), desktop binary, local DB/log files

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

## Repository Structure: Complete Breakdown

This section explains every major piece in the project and what role it plays in shipping the application.

### Root-Level Files

- `Cargo.toml`: root Rust package definition and dependency graph.
- `Cargo.lock`: locked Rust dependency versions for reproducible builds.
- `README.md`: project overview and operating guide.
- `build.rs`: Rust build-time script.
- `build-frontend.js`: frontend build orchestration and static asset flow.
- `build-dist.sh`: distribution packaging script.
- `post-build.sh`: post-build normalization steps.
- `run.sh`: main developer command entrypoint.
- `index.html`: root-level host HTML used by runtime/build integration paths.
- `test.html`: manual HTML test/debug surface.
- `.gitignore`: ignore policy for generated/runtime files.

### Root Runtime Artifacts

- `app.db`: SQLite runtime database.
- `application.log`: runtime logging output.

### Top-Level Directories

- `src/`: active Rust application source used by the root crate.
- `frontend/`: active Angular workspace.
- `static/`: runtime-served static JS/CSS assets.
- `config/`: runtime configuration (`app.config.toml`).
- `docs/`: architecture/build/reference documentation.
- `core/`: reusable backend/frontend core packages.
- `plugins/`: plugin extension area (backend + frontend).
- `apps/`: application entrypoint crates (desktop wrapper).
- `shared/`: shared protocol/type boundaries.
- `frontend-origin/`: historical frontend reference snapshot.
- `thirdparty/`: vendored upstream sources.
- `dist/`: distribution output staging.
- `target/`: Cargo build output.

## Rust Backend: `src/`

### Entrypoint

- `src/main.rs`: application bootstrap and runtime startup.

### Core Architecture (`src/core/`)

This follows a layered model:

- `src/core/domain/`: domain entities and domain-level traits.
- `src/core/application/`: use-case orchestration and app handlers.
  - `src/core/application/handlers/`: focused handler modules (UI, DB, API, sysinfo).
- `src/core/infrastructure/`: concrete implementations and external integrations.
  - `src/core/infrastructure/database/`: connection, models, user persistence.
  - `src/core/infrastructure/logging/`: logger config, formatter, and output behavior.
  - `src/core/infrastructure/config.rs`: config loading.
  - `src/core/infrastructure/di.rs`: dependency wiring.
  - `src/core/infrastructure/event_bus.rs`: backend event dispatch plumbing.
- `src/core/presentation/`: presentation boundary.
  - `src/core/presentation/webui/`: WebUI-facing handlers and bridge surface.

### Utilities (`src/utils/`)

- `compression/`, `crypto/`, `encoding/`, `file_ops/`, `network/`, `security/`, `serialization/`, `system/`, `validation/`.

These modules keep infrastructure-level helper logic out of business layers.

## Frontend App: `frontend/`

### Primary Runtime Source (`frontend/src/`)

- `frontend/src/main.ts`: Angular bootstrap and global startup wiring.
- `frontend/src/index.html`: Angular HTML template.
- `frontend/src/styles.css`: global stylesheet overrides.
- `frontend/src/winbox-loader.ts`: WinBox runtime loader.

#### App Shell (`frontend/src/app/`)

- `frontend/src/app/app.component.ts`: main shell UI, top/bottom panels, card grid, WinBox lifecycle wiring.
- `frontend/src/app/app.module.ts`: Angular module wiring.
- `frontend/src/app/app-routing.module.ts`: routing setup.
- `frontend/src/app/home/`: home component and tests.
- `frontend/src/app/demo/`: demo component and tests.
- `frontend/src/app/shared/error-modal.component.ts`: global error modal with backdrop.

#### Frontend Runtime Systems

- `frontend/src/logging/logger.ts`: structured logging system (levels, redaction, history, sinks).
- `frontend/src/error/global-error.service.ts`: root error state service.
- `frontend/src/error/global-error.handler.ts`: Angular `ErrorHandler` integration.
- `frontend/src/event-bus/event-bus.ts`: typed event bus implementation.
- `frontend/src/event-bus/events.ts`: frontend event contract map.
- `frontend/src/event-bus/index.ts`: shared event bus instance export.

#### Environment and Typing

- `frontend/src/environments/environment.ts`: development config.
- `frontend/src/environments/environment.prod.ts`: production config.
- `frontend/src/types/`: frontend declaration extensions.
- `frontend/src/assets/`: static frontend assets.

### Frontend Tooling and Build Config

- `frontend/package.json`: scripts and dependencies.
- `frontend/angular.json`: Angular build/serve configuration.
- `frontend/rspack.config.js`: Rspack config path.
- `frontend/tsconfig.json`, `frontend/tsconfig.app.json`, `frontend/tsconfig.spec.json`: TypeScript configs.
- `frontend/biome.json`: lint/format policy.
- `frontend/karma.conf.js`: unit test runner config.
- `frontend/e2e/`: end-to-end testing config.

### Frontend Generated Directories

- `frontend/dist/`: compiled frontend output.
- `frontend/.angular/`: Angular cache.
- `frontend/node_modules/`: installed JS dependencies.

## Core Packages: `core/`

### `core/backend/`

A reusable Rust backend core library with its own layered architecture:

- `core/backend/src/lib.rs`: package entrypoint.
- `core/backend/src/domain/`, `application/`, `infrastructure/`, `presentation/`.
- `core/backend/src/error/`: normalized error model and handler abstractions.
- `core/backend/src/plugin/`: plugin context, metadata, registry, and traits.

### `core/frontend/`

A reusable TypeScript frontend core package:

- `core/frontend/src/core/models.ts`: common model primitives.
- `core/frontend/src/core/viewmodel.ts`: viewmodel base behavior.
- `core/frontend/src/core/events.ts`: core event bus utility.
- `core/frontend/src/core/plugin.ts`: plugin abstractions.
- `core/frontend/src/core/service.ts`: service base patterns.
- `core/frontend/src/error/`: frontend error value model.
- `core/frontend/src/index.ts`: package export surface.

## Plugins: `plugins/`

- `plugins/backend/plugin-database/`: backend plugin example.
  - `Cargo.toml`, `plugin.json`, `src/lib.rs`.
- `plugins/frontend/`: frontend plugin extension area scaffold.

## Application Entrypoints: `apps/`

- `apps/desktop/`: desktop application wrapper crate.
  - `apps/desktop/Cargo.toml`
  - `apps/desktop/src/main.rs`

## Shared Contracts: `shared/`

- `shared/protocol/`: cross-boundary protocol scaffolding.
- `shared/types/`: shared type contract scaffolding.

## Configuration: `config/`

- `config/app.config.toml`: runtime configuration source.

Typical configuration domains include app metadata, window behavior, database settings, and logging options.

## Runtime Static Assets: `static/`

- `static/js/`: runtime JavaScript assets (including WebUI bridge files).
- `static/css/`: runtime stylesheets.

These assets are consumed by runtime HTML and desktop WebUI rendering.

## Legacy Frontend Snapshot: `frontend-origin/`

Historical frontend implementation retained for migration safety and comparison:

- independent source tree
- standalone configs
- historical event bus and bridge experiments

## Vendor Sources: `thirdparty/`

- `thirdparty/webui-c-src/`: vendored WebUI C source and examples.

## Build and Delivery Flow

1. Frontend builds from `frontend/`.
2. Static/runtime assets are assembled for WebUI runtime paths.
3. Rust binary is built via Cargo.
4. Post-build scripts normalize packaging outputs.
5. Final runnable artifacts are distributed across `target/`, `dist/`, and runtime static paths.

## Documentation Map: `docs/`

`docs/` contains architecture explainers, build references, restructuring plans, and implementation summaries.

Use these files when you want deeper design rationale beyond this README.

## Positioning for Public Use

This project is intentionally engineered to be publishable, forkable, and maintainable by teams:

- clear boundaries between core logic and delivery surfaces
- explicit extension points for plugins and shared contracts
- modern frontend runtime systems (event bus, logging, error modal)
- backend architecture ready for iterative feature growth

If you are evaluating templates for a serious product roadmap, this repository is structured to reduce rework later while preserving speed now.

## License

MIT License.
