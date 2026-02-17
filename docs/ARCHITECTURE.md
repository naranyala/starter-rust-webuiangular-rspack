# Core + Plugin-Driven Architecture

## Overview

This project has been restructured to embrace a **core + plugin-driven** architecture with complete **MVVM** pattern implementation across both backend (Rust) and frontend (TypeScript).

## Architecture Principles

### 1. Core Layer (Non-Removable)
- Essential infrastructure that all plugins depend on
- Provides DI container, event bus, plugin registry
- Implements base MVVM components

### 2. Plugin Layer (Modular)
- Features are implemented as plugins
- Can be added/removed/updated independently
- Communicate through core services

### 3. MVVM Pattern
- **Model**: Data structures and business entities
- **ViewModel**: Business logic and state management
- **View**: UI components and presentation

## Directory Structure

```
rustwebui-app/
├── core/                    # Core libraries (cannot be removed)
│   ├── backend/            # Rust core library
│   │   ├── src/
│   │   │   ├── lib.rs      # Core exports
│   │   │   ├── domain/     # Domain models & traits
│   │   │   ├── application/# Application services
│   │   │   ├── infrastructure/ # Core infrastructure
│   │   │   ├── presentation/   # Presentation layer
│   │   │   └── plugin/     # Plugin system
│   │   └── Cargo.toml
│   │
│   └── frontend/           # TypeScript core library
│       ├── src/
│       │   ├── core/
│       │   │   ├── models.ts      # Base models
│       │   │   ├── viewmodel.ts   # ViewModel base
│       │   │   ├── events.ts      # Event bus
│       │   │   ├── plugin.ts      # Plugin system
│       │   │   └── service.ts     # Services
│       │   └── index.ts
│       └── package.json
│
├── plugins/                 # Plugins (modular features)
│   ├── backend/
│   │   └── plugin-database/ # Database plugin example
│   │       ├── src/lib.rs
│   │       ├── Cargo.toml
│   │       └── plugin.json
│   └── frontend/
│       └── plugin-database/ # Frontend plugin example
│
├── apps/                    # Applications
│   └── desktop/            # Desktop application
│       ├── src/main.rs
│       └── Cargo.toml
│
└── shared/                  # Shared code
    ├── protocol/           # Communication protocol
    └── types/              # Shared types
```

## Backend (Rust)

### Core Plugin Trait

```rust
use rustwebui_core::prelude::*;

#[async_trait::async_trait]
impl Plugin for MyPlugin {
    fn id(&self) -> &str { "my-plugin" }
    
    fn metadata(&self) -> &PluginMetadata { &self.metadata }
    
    async fn initialize(&mut self, ctx: &PluginContext) -> Result<()> {
        // Initialize plugin
        Ok(())
    }
    
    async fn shutdown(&mut self) -> Result<()> {
        // Cleanup
        Ok(())
    }
    
    fn get_handlers(&self) -> Vec<EventHandler> {
        vec![
            EventHandler::new("my_function", |ctx| {
                Ok(r#"{"success": true}"#.to_string())
            })
        ]
    }
}
```

### Creating a Plugin

1. Create plugin directory: `plugins/backend/plugin-myfeature/`
2. Add `plugin.json`:
```json
{
  "name": "myfeature",
  "version": "1.0.0",
  "description": "My feature plugin",
  "dependencies": []
}
```
3. Implement `Plugin` trait
4. Register in app

## Frontend (TypeScript)

### Core ViewModel

```typescript
import { BaseViewModel, observable } from '@rustwebui/core';

export class UsersViewModel extends BaseViewModel {
  @observable users: User[] = [];
  @observable loading = false;
  
  async initialize(): Promise<void> {
    await this.loadUsers();
  }
  
  async loadUsers() {
    this.loading = true;
    this.users = await this.callBackend<User[]>('get_users');
    this.loading = false;
  }
  
  dispose(): void {
    // Cleanup
  }
}
```

### Creating a Frontend Plugin

```typescript
import { BasePlugin, PluginContext } from '@rustwebui/core';

export class DatabasePlugin extends BasePlugin {
  name = 'database';
  version = '1.0.0';
  
  async initialize(ctx: PluginContext): Promise<void> {
    ctx.registerViewModel('users', new UsersViewModel(ctx.eventBus));
    ctx.registerComponent('user-table', UserTableComponent);
  }
}
```

## MVVM Flow

### Backend

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

### Frontend

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Model     │◀───▶│  ViewModel  │◀───▶│    View     │
│  (State)    │     │  (Logic)    │     │ (Component) │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │   Backend   │
                    │   (API)     │
                    └─────────────┘
```

## Building

### Build Core

```bash
# Backend core
cd core/backend && cargo build

# Frontend core
cd core/frontend && npm install && npm run build
```

### Build Plugins

```bash
# Backend plugins
cd plugins/backend/plugin-database && cargo build

# Frontend plugins
cd plugins/frontend/plugin-database && npm install && npm run build
```

### Build Application

```bash
cd apps/desktop && cargo build
```

## Benefits

✅ **Modularity** - Add/remove features without touching core
✅ **Testability** - Test plugins independently  
✅ **Extensibility** - Easy to add new features
✅ **Maintainability** - Clear separation of concerns
✅ **Reusability** - Plugins can be shared
✅ **Scalability** - Load plugins on-demand

## Next Steps

1. Migrate existing features to plugins
2. Create frontend plugin components
3. Implement hot-reload support
4. Add plugin marketplace
