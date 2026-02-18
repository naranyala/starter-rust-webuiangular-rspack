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
- It embraces MVVM pattern on the Angular frontend with clear separation of models, viewmodels, and views.
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

## Repository Structure Overview

```
.
├── src/                    # Active Rust application (main entry)
├── frontend/               # Active Angular workspace (MVVM)
├── core/                  # Reusable backend/frontend core packages
├── plugins/               # Plugin extension area
├── apps/                  # Application entrypoint crates
├── shared/                # Shared protocol/type boundaries
├── config/                # Runtime configuration
├── static/                # Runtime static JS/CSS assets
├── frontend-origin/       # Historical frontend reference
├── frontend/src-origin/   # Pre-MVVM frontend snapshot
├── thirdparty/            # Vendored upstream sources
├── dist/                  # Distribution output
└── target/                # Cargo build output
```

---

## Rust Backend: `src/`

### Entrypoint

- `src/main.rs`: application bootstrap and runtime startup.

### Core Architecture (`src/core/`)

This follows a layered model (Domain-Driven Design inspired):

- `src/core/domain/`: domain entities and domain-level traits.
- `src/core/application/`: use-case orchestration and app handlers.
  - `src/core/application/handlers/`: focused handler modules (UI, DB, API, sysinfo, window_state).
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

---

## Frontend App: `frontend/` (MVVM Pattern)

### Primary Runtime Source (`frontend/src/`)

```
frontend/src/
├── main.ts                    # Angular bootstrap and global startup wiring
├── winbox-loader.ts          # WinBox runtime loader
├── environments/             # Environment configs (dev/prod)
├── types/                   # TypeScript declarations
├── polyfills.ts             # Angular polyfills
├── test.ts                  # Test configuration
│
├── models/                  # M - Data interfaces and types
│   ├── index.ts             # Barrel export
│   ├── card.model.ts        # Card entity interfaces
│   ├── window.model.ts      # Window state interfaces
│   └── log.model.ts         # Logging interfaces
│
├── viewmodels/              # VM - Business logic and state management
│   ├── index.ts             # Barrel export
│   ├── logging.viewmodel.ts # Logging backend service
│   ├── logger.ts            # Logger facade API
│   ├── event-bus.viewmodel.ts # Event bus implementation
│   └── window-state.viewmodel.ts # Window state management
│
├── views/                   # V - Angular components
│   ├── app.component.ts     # Main shell component
│   ├── app.module.ts        # Angular module
│   ├── app-routing.module.ts # Routing configuration
│   ├── home/
│   │   └── home.component.ts
│   ├── demo/
│   │   └── demo.component.ts
│   └── shared/
│       └── error-modal.component.ts
│
└── core/                   # Shared infrastructure
    ├── index.ts
    ├── global-error.service.ts
    └── global-error.handler.ts
```

### MVVM Pattern Explanation

**Models (`models/`):**
- Pure data interfaces and type definitions
- No business logic, only data shape contracts
- Examples: `Card`, `WindowEntry`, `LogEntry`

**ViewModels (`viewmodels/`):**
- Business logic and state management services
- Angular services decorated with `@Injectable`
- Handle data transformation, state, and communication
- Examples: `LoggingViewModel`, `EventBusViewModel`, `WindowStateViewModel`

**Views (`views/`):**
- Angular components (presentation layer)
- Handle UI rendering and user interaction
- Consume ViewModels via dependency injection
- Examples: `AppComponent`, `DemoComponent`, `HomeComponent`

**Core (`core/`):**
- Cross-cutting concerns
- Error handling infrastructure
- Shared utilities that don't fit in other layers

### Frontend Tooling and Build Config

- `frontend/package.json`: scripts and dependencies.
- `frontend/angular.json`: Angular build/serve configuration.
- `frontend/tsconfig.json`, `frontend/tsconfig.app.json`, `frontend/tsconfig.spec.json`: TypeScript configs.
- `frontend/biome.json`: lint/format policy.
- `frontend/e2e/`: end-to-end testing config.

### Frontend Generated Directories

- `frontend/dist/`: compiled frontend output.
- `frontend/.angular/`: Angular cache.
- `frontend/node_modules/`: installed JS dependencies.

---

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

---

## Plugins: `plugins/`

- `plugins/backend/plugin-database/`: backend plugin example.
  - `Cargo.toml`, `plugin.json`, `src/lib.rs`.
- `plugins/frontend/`: frontend plugin extension area scaffold.

---

## Application Entrypoints: `apps/`

- `apps/desktop/`: desktop application wrapper crate.
  - `apps/desktop/Cargo.toml`
  - `apps/desktop/src/main.rs`

---

## Shared Contracts: `shared/`

- `shared/protocol/`: cross-boundary protocol scaffolding.
- `shared/types/`: shared type contract scaffolding.

---

## Configuration: `config/`

- `config/app.config.toml`: runtime configuration source.

Typical configuration domains include app metadata, window behavior, database settings, and logging options.

---

## Runtime Static Assets: `static/`

- `static/js/`: runtime JavaScript assets (including WebUI bridge files).
- `static/css/`: runtime stylesheets.

These assets are consumed by runtime HTML and desktop WebUI rendering.

---

## Legacy Frontend Snapshots

### `frontend-origin/`

Historical frontend implementation retained for migration safety and comparison:

- independent source tree
- standalone configs
- historical event bus and bridge experiments

### `frontend/src-origin/`

Pre-MVVM restructuring snapshot kept for reference during transition.

---

## Vendor Sources: `thirdparty/`

- `thirdparty/webui-c-src/`: vendored WebUI C source and examples.

---

## Build and Delivery Flow

1. Frontend builds from `frontend/` using Angular CLI or Rspack.
2. Static/runtime assets are assembled for WebUI runtime paths.
3. Rust binary is built via Cargo.
4. Post-build scripts normalize packaging outputs.
5. Final runnable artifacts are distributed across `target/`, `dist/`, and runtime static paths.

---

## Documentation Map: `docs/`

`docs/` contains architecture explainers, build references, restructuring plans, and implementation summaries.

Use these files when you want deeper design rationale beyond this README.

---

## Potential Improvements

The following suggestions are focused on project structure improvements to enhance maintainability, scalability, and code clarity.

### Frontend Structure

1. **Consolidate Core Packages**
   - Consider merging `core/frontend/` with `frontend/src/core/` to eliminate duplication
   - Create a single source of truth for shared frontend utilities

2. **Extract Shared Types**
   - Move duplicated type definitions between `frontend/src/models/`, `core/frontend/src/core/models.ts`, and event contracts into a single shared package
   - Use `shared/` directory for cross-boundary type contracts

3. **Modularize ViewModels**
   - Consider grouping related viewmodels into feature-specific folders (e.g., `viewmodels/windows/`, `viewmodels/logging/`)
   - Add barrel exports (`index.ts`) for each feature module

4. **Separate Routing Configuration**
   - Move routing logic from `views/app-routing.module.ts` to a dedicated `views/routes/` directory
   - Consider lazy loading routes with separate route files per feature

5. **Feature-Based Directory Structure**
   - Restructure from layer-based (models/, views/, viewmodels/) to feature-based:
     ```
     features/
       ├── windows/
       │   ├── models/
       │   ├── viewmodels/
       │   └── components/
       └── logging/
           ├── models/
           ├── viewmodels/
           └── components/
     ```

### Backend Structure

6. **Consolidate Handler Locations**
   - Handlers exist in both `src/core/application/handlers/` and `src/core/presentation/webui/handlers/`
   - Establish clear ownership: application handlers for use cases, presentation handlers for UI binding

7. **Extract Infrastructure Services**
   - Move concrete infrastructure implementations from `src/utils/` into `src/core/infrastructure/`
   - Keep `src/utils/` for truly generic, application-agnostic utilities

8. **Plugin System Refinement**
   - Formalize plugin contract between `core/backend/src/plugin/` and `plugins/backend/`
   - Consider frontend plugin architecture to complement backend plugins

9. **Shared Error Handling**
   - Unify error types across `core/backend/src/error/` and main application handlers
   - Create standardized error codes for frontend-backend communication

### Build and Configuration

10. **Consolidate Frontend Variants**
    - Choose between `frontend/` (MVVM), `frontend-origin/`, and `frontend/src-origin/`
    - Keep only one active frontend and archive others

11. **Environment Configuration**
    - Centralize environment-specific settings in `config/` rather than having them split between `config/` and `frontend/src/environments/`

12. **Build Script Organization**
    - Consider moving build-related scripts to a dedicated `scripts/` directory at root level
    - Document build pipeline dependencies more explicitly

### General Architecture

13. **Documentation Generation**
    - Add documentation comments to public APIs in both Rust and TypeScript
    - Consider using Rust's `rustdoc` and TypeScript's documentation generators

14. **Testing Strategy**
    - Establish clear testing directory structure (e.g., `tests/` for integration, co-located unit tests)
    - Add test configuration for the new MVVM structure

15. **CI/CD Pipeline Definition**
    - Add `.github/workflows/` or similar for automated builds and tests
    - Define clear build matrix for different target platforms

---

## Positioning for Public Use

This project is intentionally engineered to be publishable, forkable, and maintainable by teams:

- clear boundaries between core logic and delivery surfaces
- explicit extension points for plugins and shared contracts
- modern frontend runtime systems (MVVM, event bus, logging, error modal)
- backend architecture ready for iterative feature growth

If you are evaluating templates for a serious product roadmap, this repository is structured to reduce rework later while preserving speed now.

---

## License

MIT License.
