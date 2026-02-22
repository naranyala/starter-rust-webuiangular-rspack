# Introduction

## Project Overview

**Rust WebUI + Angular + Rspack Starter** is a production-ready framework for building desktop applications that combine:

- **Rust** reliability and performance in the application core
- **Angular** velocity for rich, iterative UI development  
- **WebUI** desktop delivery without Electron's memory overhead
- **Clean Architecture** with layered separation of concerns
- **MVVM Pattern** for maintainable frontend code

This is not a toy scaffold—it's a platform designed for teams building serious desktop applications that need to scale from prototype to production.

## Why This Project Exists

Most starter templates optimize for a quick "hello world" demo. This project optimizes for **long-term product delivery**:

| Traditional Starter | This Project |
|---------------------|--------------|
| Single-layer architecture | Clean Architecture (4 layers) |
| Ad-hoc error handling | Type-safe "Errors as Values" pattern |
| No testing infrastructure | Unit tests + integration test structure |
| Direct DB access | Connection pooling with r2d2 |
| Console.log debugging | Comprehensive DevTools panel |
| No code quality enforcement | Biome linting + formatting |

## Core Value Propositions

### 1. Architecture That Scales

The codebase is structured to prevent architectural decay as your team and features grow:

```
Backend (Rust):
┌─────────────────────────────────────────┐
│         Presentation Layer              │  ← WebUI handlers
├─────────────────────────────────────────┤
│       Application Layer                 │  ← Use cases, handlers
├─────────────────────────────────────────┤
│         Domain Layer                    │  ← Business entities
├─────────────────────────────────────────┤
│      Infrastructure Layer               │  ← DB, logging, config
└─────────────────────────────────────────┘

Frontend (Angular):
┌─────────────────────────────────────────┐
│            Views (Components)           │  ← UI presentation
├─────────────────────────────────────────┤
│         ViewModels (State)              │  ← Business logic
├─────────────────────────────────────────┤
│          Models (Data)                  │  ← Type definitions
└─────────────────────────────────────────┘
```

### 2. Developer Experience First

- **Fast Builds**: Rspack bundler provides 10x faster builds than webpack
- **Type Safety**: Full TypeScript strict mode with comprehensive typing
- **Code Quality**: Biome enforces consistent style automatically
- **Debugging**: DevTools panel exposes all runtime internals
- **Error Visibility**: Every error logged to terminal with context

### 3. Production-Ready Features

- **Connection Pooling**: SQLite with r2d2 pool (no mutex bottlenecks)
- **Error Tracking**: Panic hooks, error history, statistics
- **Event Bus**: Pub/sub messaging for decoupled components
- **Logging**: Multi-sink logging (console + file + backend)
- **Configuration**: TOML-based config with environment overrides

## Technology Stack

### Backend Technologies

| Category | Technology | Purpose |
|----------|------------|---------|
| **Language** | Rust 1.93+ | Memory-safe systems programming |
| **Desktop** | WebUI 2.5 | Native WebView binding |
| **Database** | SQLite + r2d2 | Embedded DB with pooling |
| **Serialization** | serde + serde_json | Type-safe JSON handling |
| **Logging** | log + custom logger | Structured logging |
| **Error Handling** | backtrace | Stack traces on panic |

### Frontend Technologies

| Category | Technology | Purpose |
|----------|------------|---------|
| **Framework** | Angular 21.1.5 | Component-based UI |
| **Language** | TypeScript 5.9 | Type safety |
| **Bundler** | Rspack 1.7.6 | Fast webpack-compatible bundling |
| **Linter** | Biome 2.4.4 | Fast Rust-based linting |
| **Package Manager** | Bun 1.3 | Fast npm alternative |
| **Windowing** | WinBox 0.2.82 | Desktop window management |
| **Reactive** | RxJS 7.8.2 | Observable streams |

### Build & DevOps

| Tool | Purpose |
|------|---------|
| Cargo | Rust package manager and build system |
| Angular CLI | Angular build orchestration |
| Rspack | Production bundling |
| Biome | Code quality enforcement |

## Application Capabilities

### Desktop Features
- ✅ Native window management
- ✅ System information monitoring
- ✅ File system operations
- ✅ SQLite database CRUD
- ✅ Real-time IPC communication
- ✅ Multi-window support (WinBox)

### Data Management
- ✅ User management (CRUD)
- ✅ Event history tracking
- ✅ Log aggregation
- ✅ Configuration management
- ✅ State persistence

### Developer Tools
- ✅ DevTools panel (5 tabs)
- ✅ Error dashboard
- ✅ Event bus inspector
- ✅ Performance benchmarks
- ✅ Environment info

## Use Cases

This framework is ideal for:

### ✅ Good Fit
- **Admin Dashboards** - Data-heavy management interfaces
- **Developer Tools** - IDEs, debuggers, profilers
- **Data Applications** - Forms, data entry, reporting
- **System Utilities** - Monitoring, configuration tools
- **Enterprise Tools** - Internal business applications
- **Offline-First Apps** - Local database with sync capability

### ❌ Not Recommended For
- **Simple Static Sites** - Overkill for basic content sites
- **Mobile Apps** - Desktop-focused (consider Tauri for mobile)
- **High-Frequency Trading** - WebView adds latency
- **Games** - Use dedicated game engines instead

## Architecture Highlights

### Backend: Clean Architecture

```rust
// Domain Layer - Pure business entities
pub struct User {
    pub id: i64,
    pub email: String,
    pub role: Role,
}

// Application Layer - Use cases
pub struct CreateUserHandler {
    user_repo: Arc<UserRepository>,
}

// Infrastructure Layer - External concerns
pub struct Database {
    pool: Pool<SqliteConnectionManager>,
}

// Presentation Layer - WebUI integration
window.bind("create_user", |event| {
    // Handler receives event, calls use case
});
```

### Frontend: MVVM Pattern

```typescript
// Model - Data structure
export interface User {
  id: number;
  email: string;
  role: string;
}

// ViewModel - Business logic + state
@Injectable()
export class UserViewModel {
  readonly users = signal<User[]>([]);
  readonly loading = signal(false);
  
  async loadUsers() {
    this.loading.set(true);
    const users = await this.api.getUsers();
    this.users.set(users);
  }
}

// View - Component template
@Component({
  template: `
    @for (user of users(); track user.id) {
      <user-card [user]="user"></user-card>
    }
  `
})
export class UserComponent {
  readonly vm = inject(UserViewModel);
}
```

## Getting Started

### Quick Start (5 minutes)

```bash
# 1. Clone
git clone <repository-url>
cd starter-rust-webuiangular-rspack

# 2. Install dependencies
cd frontend && bun install && cd ..

# 3. Run
./run.sh
```

### Next Steps

1. **Read [Getting Started](07-getting-started.md)** - Detailed setup instructions
2. **Explore Architecture](02-architecture.md)** - Understand the layers
3. **Review Project Structure](08-project-structure.md)** - Navigate the codebase
4. **Try DevTools Panel** - Click bottom bar → DevTools tab

## Documentation Index

| Document | Description |
|----------|-------------|
| [Getting Started](07-getting-started.md) | Installation and first run |
| [Architecture](02-architecture.md) | System design and patterns |
| [Project Structure](08-project-structure.md) | Repository organization |
| [Build System](03-build-system.md) | Build and deployment |
| [Communication](04-communication.md) | Frontend-backend IPC |
| [Dependencies](05-dependencies.md) | Complete dependency list |
| [Error Handling](../ERROR_HANDLING_GUIDE.md) | Error patterns guide |
| [Connection Pooling](REFACTORING_CONNECTION_POOLING.md) | Database optimization |
| [Improvements](06-improvements.md) | Enhancement suggestions |

## Community & Support

- **Issues**: Report bugs on GitHub Issues
- **Discussions**: Ask questions on GitHub Discussions
- **Documentation**: Browse `/docs` folder
- **Examples**: Check `src/utils_demo.rs` and `frontend/src/views/demo/`

## License

MIT License - See LICENSE file for terms.

---

**Ready to build?** Continue to [Getting Started](07-getting-started.md) →
