# Core + Plugin-Driven Architecture Plan

## Vision

Transform the project into a modular, extensible architecture where:
- **Core** provides essential infrastructure and cannot be removed
- **Plugins** are modular features that can be added/removed/updated independently
- **MVVM** pattern is fully implemented across both backend (Rust) and frontend (TypeScript)

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        APPLICATION LAYER                         │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Plugin Manager                          │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │  │
│  │  │ Database │ │  System  │ │  Logging │ │   User   │     │  │
│  │  │  Plugin  │ │  Plugin  │ │  Plugin  │ │  Plugin  │     │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘     │  │
│  └───────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                          CORE LAYER                              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐ │
│  │   Domain    │ │ Application │ │Infrastructure│ │Presentation│ │
│  │   (Models)  │ │  (ViewModel)│ │  (Services) │ │   (View)  │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └───────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              Core Services (Always Active)                  │ │
│  │  • Dependency Injection  • Event Bus  • Configuration      │ │
│  │  • Plugin Registry       • Logging    • Error Handling     │ │
│  └────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                      FRONTEND (MVVM)                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │
│  │   Models    │ │ ViewModels  │ │   Views     │               │
│  │  (State)    │ │ (Logic)     │ │ (Components)│               │
│  └─────────────┘ └─────────────┘ └─────────────┘               │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │            Plugin System (Frontend Plugins)                 │ │
│  │  • UI Components  • Widgets  • Dashboard Panels            │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
rustwebui-app/
├── Cargo.toml
├── package.json (frontend)
│
├── core/                          # CORE - Cannot be removed
│   ├── backend/                   # Rust Core
│   │   ├── src/
│   │   │   ├── lib.rs            # Core library
│   │   │   ├── domain/           # Shared domain models
│   │   │   │   ├── mod.rs
│   │   │   │   ├── entities/     # Core entities
│   │   │   │   └── traits/       # Core traits
│   │   │   ├── application/      # Core application logic
│   │   │   │   ├── mod.rs
│   │   │   │   ├── services/     # Core services
│   │   │   │   └── events/       # Core events
│   │   │   ├── infrastructure/   # Core infrastructure
│   │   │   │   ├── mod.rs
│   │   │   │   ├── di/          # Dependency injection
│   │   │   │   ├── event_bus/   # Event bus
│   │   │   │   └── plugin/      # Plugin system
│   │   │   └── presentation/     # Core presentation
│   │   │       ├── mod.rs
│   │   │       └── webui/       # WebUI bridge
│   │   └── Cargo.toml
│   │
│   └── frontend/                  # TypeScript Core
│       ├── src/
│       │   ├── core/
│       │   │   ├── models/       # Core models
│       │   │   ├── viewmodels/   # Core ViewModels
│       │   │   ├── services/     # Core services
│       │   │   └── events/       # Core events
│       │   └── lib.ts
│       └── package.json
│
├── plugins/                       # PLUGINS - Modular features
│   ├── backend/                   # Rust Plugins
│   │   ├── plugin-database/      # Database plugin
│   │   │   ├── src/
│   │   │   ├── Cargo.toml
│   │   │   └── plugin.json       # Plugin metadata
│   │   ├── plugin-system/        # System info plugin
│   │   ├── plugin-logging/       # Enhanced logging plugin
│   │   └── plugin-user/          # User management plugin
│   │
│   └── frontend/                  # TypeScript Plugins
│       ├── plugin-database/      # Database UI plugin
│       │   ├── src/
│       │   │   ├── components/   # Vue/React components
│       │   │   ├── viewmodels/   # Plugin ViewModels
│       │   │   └── styles/       # Plugin styles
│       │   ├── package.json
│       │   └── plugin.json
│       ├── plugin-system/        # System info UI plugin
│       └── plugin-dashboard/     # Dashboard plugin
│
├── apps/                          # APPLICATIONS
│   ├── desktop/                   # Desktop app (WebUI)
│   │   ├── src/
│   │   │   └── main.rs           # App entry point
│   │   └── Cargo.toml
│   └── web/                       # Web app (optional)
│
├── shared/                        # SHARED (Backend + Frontend)
│   ├── protocol/                  # Communication protocol
│   ├── types/                     # Shared types
│   └── utils/                     # Shared utilities
│
└── docs/
    ├── architecture.md
    ├── plugin-development.md
    └── mvvm-pattern.md
```

## Core Components (Non-Removable)

### Backend Core (`core/backend/`)

```rust
// Core traits that all plugins must implement
pub trait Plugin {
    fn name(&self) -> &str;
    fn version(&self) -> &str;
    fn initialize(&mut self, ctx: &PluginContext) -> Result<()>;
    fn shutdown(&mut self) -> Result<()>;
    fn get_handlers(&self) -> Vec<EventHandler>;
}

// Core services
pub struct CoreServices {
    pub di: DIContainer,
    pub event_bus: EventBus,
    pub plugin_registry: PluginRegistry,
    pub config: AppConfig,
}
```

### Frontend Core (`core/frontend/`)

```typescript
// Core ViewModel base
export abstract class BaseViewModel {
  protected eventBus: EventBus;
  abstract initialize(): Promise<void>;
  abstract dispose(): void;
}

// Core plugin interface
export interface IPlugin {
  name: string;
  version: string;
  initialize(ctx: PluginContext): Promise<void>;
  getComponents(): Component[];
}
```

## Plugin Examples

### Backend Plugin (Rust)

```rust
// plugins/backend/plugin-database/src/lib.rs
use core_backend::prelude::*;

#[derive(Default)]
pub struct DatabasePlugin {
    db: Option<Arc<Database>>,
}

impl Plugin for DatabasePlugin {
    fn name(&self) -> &str { "database" }
    fn version(&self) -> &str { "1.0.0" }
    
    fn initialize(&mut self, ctx: &PluginContext) -> Result<()> {
        let db = Database::new("app.db")?;
        self.db = Some(Arc::new(db));
        ctx.register_service(self.db.clone().unwrap());
        Ok(())
    }
    
    fn get_handlers(&self) -> Vec<EventHandler> {
        vec![
            EventHandler::new("get_users", |event| self.get_users(event)),
            EventHandler::new("create_user", |event| self.create_user(event)),
        ]
    }
}

// Plugin metadata
// plugins/backend/plugin-database/plugin.json
{
  "name": "database",
  "version": "1.0.0",
  "description": "SQLite database integration",
  "dependencies": [],
  "core_version": ">=1.0.0"
}
```

### Frontend Plugin (TypeScript)

```typescript
// plugins/frontend/plugin-database/src/index.ts
import { BasePlugin, ViewModel } from '@core/frontend';

export class DatabasePlugin extends BasePlugin {
  name = 'database';
  version = '1.0.0';
  
  async initialize(ctx: PluginContext) {
    ctx.registerViewModel('users', new UsersViewModel());
    ctx.registerComponent('user-table', UserTableComponent);
  }
  
  getComponents() {
    return [UserTableComponent, UserFormComponent];
  }
}

// plugins/frontend/plugin-database/src/viewmodels/users.vm.ts
export class UsersViewModel extends BaseViewModel {
  @observable users: User[] = [];
  @observable loading = false;
  @observable error: string | null = null;
  
  async loadUsers() {
    this.loading = true;
    try {
      this.users = await this.callBackend('get_users');
    } catch (e) {
      this.error = e.message;
    } finally {
      this.loading = false;
    }
  }
}
```

## MVVM Flow

### Backend MVVM

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Domain    │────▶│ Application │────▶│Infrastructure│
│   (Model)   │     │ (ViewModel) │     │  (Service)  │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │ Presentation│
                    │   (View)    │
                    └─────────────┘
```

### Frontend MVVM

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Model     │────▶│  ViewModel  │────▶│    View     │
│  (State)    │◀───▶│  (Logic)    │◀───▶│ (Component) │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │   Backend   │
                    │   (API)     │
                    └─────────────┘
```

## Implementation Phases

### Phase 1: Core Foundation
- [ ] Create core backend library
- [ ] Create core frontend library
- [ ] Implement plugin system
- [ ] Setup dependency injection

### Phase 2: Migrate Existing Features
- [ ] Move database to plugin
- [ ] Move system info to plugin
- [ ] Move logging to plugin
- [ ] Create main app that loads plugins

### Phase 3: Frontend MVVM
- [ ] Create base ViewModel class
- [ ] Create plugin components
- [ ] Implement data binding
- [ ] Create plugin loader

### Phase 4: Integration
- [ ] Backend-Frontend communication
- [ ] Plugin discovery and loading
- [ ] Hot-reload support
- [ ] Documentation

## Benefits

✅ **Modularity** - Add/remove features without touching core
✅ **Testability** - Test plugins independently
✅ **Extensibility** - Easy to add new features
✅ **Maintainability** - Clear separation of concerns
✅ **Reusability** - Plugins can be shared across projects
✅ **Scalability** - Load plugins on-demand
