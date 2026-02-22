# Rust WebUI + Angular + Rspack Starter

[![Rust](https://img.shields.io/badge/Rust-1.93+-orange.svg)](https://www.rust-lang.org)
[![Angular](https://img.shields.io/badge/Angular-21.1.5-red.svg)](https://angular.dev)
[![Biome](https://img.shields.io/badge/Biome-2.4.4-green.svg)](https://biomejs.dev)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**Build desktop-class applications with modern web technologies and Rust performance.** A production-ready starter template featuring Clean Architecture, MVVM pattern, comprehensive error handling, connection pooling, and an integrated DevTools panel.

---

## 🚀 Quick Start

```bash
# Clone and run
git clone <repository-url>
cd starter-rust-webuiangular-rspack
./run.sh
```

### Common Commands

```bash
./run.sh --build            # Build frontend + backend
./run.sh --build-frontend   # Build frontend only
./run.sh --build-rust       # Build backend only
./run.sh --release          # Build optimized release
./run.sh --run              # Run existing build
./run.sh --clean            # Clean artifacts
./run.sh --rebuild          # Clean + rebuild
./run.sh --help             # Show all options
```

---

## ✨ Features

### 🏗️ Architecture
- **Clean Architecture** (Rust backend) - Domain, Application, Infrastructure, Presentation layers
- **MVVM Pattern** (Angular frontend) - Models, ViewModels, Views separation
- **Event-Driven Design** - Pub/sub event bus for decoupled communication
- **Plugin System** - Extensible architecture for custom functionality

### 🦀 Backend (Rust)
- **WebUI Integration** - Native desktop windowing without Electron overhead
- **SQLite Database** - Embedded database with connection pooling (r2d2)
- **Enhanced Error Handling** - Panic hooks, error tracking, terminal output
- **Comprehensive Logging** - Multi-sink logging with JSON formatting
- **Cross-Platform** - Windows, macOS, Linux support
- **Serialization** - JSON, MessagePack, CBOR support via serde

### 🎨 Frontend (Angular)
- **Angular 21.1.5** - Latest Angular with Signals and modern features
- **Rspack Bundler** - 10x faster builds than webpack
- **Biome Linter** - Fast Rust-based linting and formatting
- **Error Interceptor** - Global error catching and reporting
- **Event Bus Service** - Reactive event management
- **DevTools Panel** - Comprehensive debugging interface (5 tabs)

### 🔧 Developer Experience
- **Hot Module Replacement** - Fast development with live reload
- **Type Safety** - Full TypeScript typing with strict mode
- **Code Quality** - Biome linting and formatting enforced
- **Build Orchestration** - Automated build pipelines
- **Configuration** - TOML-based configuration management

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [📖 Getting Started](docs/07-getting-started.md) | Installation, setup, and first run |
| [🏛️ Architecture](docs/02-architecture.md) | System architecture and design patterns |
| [📦 Project Structure](docs/08-project-structure.md) | Repository layout and organization |
| [🔨 Build System](docs/03-build-system.md) | Build pipeline and deployment |
| [🔌 Communication](docs/04-communication.md) | Frontend-backend IPC patterns |
| [⚠️ Error Handling](ERROR_HANDLING_GUIDE.md) | Comprehensive error handling guide |
| [🔧 Biome Setup](frontend/BIOME_SETUP.md) | Linter and formatter configuration |
| [📊 Connection Pooling](docs/REFACTORING_CONNECTION_POOLING.md) | Database pooling implementation |
| [📋 Dependencies](docs/05-dependencies.md) | Complete dependency reference |
| [🎯 Improvements](docs/06-improvements.md) | Suggested enhancements |

---

## 🏗️ Project Structure

```
starter-rust-webuiangular-rspack/
│
├── 📄 Cargo.toml                 # Rust package manifest
├── 📄 Cargo.lock                 # Dependency lock file
├── 📄 build.rs                   # Cargo build script
├── 📄 run.sh                     # Main run script
├── 📄 build-frontend.js          # Frontend build orchestration
├── 📄 build-dist.sh              # Distribution builder
├── 📄 post-build.sh              # Post-build processing
│
├── 📂 src/                       # Rust backend source
│   ├── main.rs                   # Application entry point
│   ├── utils_demo.rs             # Utility demonstrations
│   │
│   └── 📂 core/                  # Clean Architecture
│       ├── domain/               # Business entities & traits
│       ├── application/          # Use cases & handlers
│       ├── infrastructure/       # DB, logging, config, DI
│       │   ├── database/         # SQLite with connection pooling
│       │   ├── logging/          # Multi-sink logging
│       │   ├── error_handler.rs  # Enhanced error handling
│       │   └── di.rs             # Dependency injection
│       └── presentation/         # WebUI integration
│           └── webui/handlers/   # Event handlers
│
├── 📂 frontend/                  # Angular frontend
│   ├── src/
│   │   ├── main.ts               # Angular entry point
│   │   ├── index.html            # HTML template
│   │   │
│   │   ├── 📂 views/             # Angular components
│   │   │   ├── app.component.ts  # Root component
│   │   │   ├── home/             # Home feature
│   │   │   ├── demo/             # Demo feature
│   │   │   └── devtools/         # 🛠️ DevTools panel
│   │   │
│   │   ├── 📂 viewmodels/        # MVVM ViewModels
│   │   │   ├── event-bus.viewmodel.ts
│   │   │   ├── logging.viewmodel.ts
│   │   │   ├── window-state.viewmodel.ts
│   │   │   └── error-dashboard.viewmodel.ts
│   │   │
│   │   ├── 📂 core/              # Core services
│   │   │   ├── global-error.handler.ts
│   │   │   ├── global-error.service.ts
│   │   │   ├── error-interceptor.ts
│   │   │   └── winbox.service.ts
│   │   │
│   │   ├── 📂 models/            # Data models
│   │   ├── 📂 types/             # TypeScript types
│   │   └── 📂 environments/      # Environment configs
│   │
│   ├── angular.json              # Angular CLI config
│   ├── rspack.config.js          # Rspack bundler config
│   ├── biome.json                # Biome linter config
│   ├── tsconfig.json             # TypeScript config
│   └── package.json              # NPM dependencies
│
├── 📂 config/                    # Runtime configuration
│   └── app.config.toml           # Application config
│
├── 📂 docs/                      # Documentation
│   ├── 01-introduction.md
│   ├── 02-architecture.md
│   ├── 03-build-system.md
│   ├── 04-communication.md
│   ├── 05-dependencies.md
│   ├── 06-improvements.md
│   ├── 07-getting-started.md
│   ├── 08-project-structure.md
│   ├── 09-errors-as-values.md
│   └── REFACTORING_CONNECTION_POOLING.md
│
├── 📂 thirdparty/                # Third-party libraries
│   └── webui-c-src/              # WebUI C source
│
└── 📂 static/                    # Static assets (runtime)
    ├── js/
    └── css/
```

---

## 🛠️ Technology Stack

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Rust | 1.93+ | Core language |
| WebUI | 2.5.0-beta.4 | Desktop windowing |
| SQLite | 0.32 | Embedded database |
| r2d2 | 0.8 | Connection pooling |
| serde | 1.0 | Serialization |
| log | 0.4 | Logging facade |
| backtrace | 0.3 | Stack traces |

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| Angular | 21.1.5 | UI framework |
| TypeScript | 5.9 | Type safety |
| Rspack | 1.7.6 | Bundler |
| Biome | 2.4.4 | Linter/formatter |
| Bun | 1.3 | Package manager |
| WinBox | 0.2.82 | Window management |
| RxJS | 7.8.2 | Reactive extensions |

### Build Tools
| Tool | Purpose |
|------|---------|
| Cargo | Rust build system |
| Angular CLI | Angular build tool |
| Rspack | Fast webpack-compatible bundler |
| Biome | Fast linter and formatter |

---

## 🎯 Key Capabilities

### Desktop Application Features
- Native window management with WinBox integration
- System information monitoring
- File system operations
- Database CRUD operations
- Real-time event bus communication

### Developer Tools
- **DevTools Panel** (5 tabs):
  - 🖥️ Backend - Stats, logs, bindings
  - 🎨 Frontend - Events, errors, memory
  - 📡 Events - Event history and payloads
  - 🌍 Environment - Browser info, features
  - ⚡ Actions - Test scenarios, benchmarks

- **Error Dashboard** - Visual error tracking
- **Console Logging** - Structured error output
- **Performance Benchmarks** - Event bus, signals

### Data Management
- SQLite database with connection pooling
- User management (CRUD operations)
- Event history tracking
- Log aggregation and retrieval

---

## 📦 Installation

### Prerequisites

- **Rust** 1.93+ ([install](https://www.rust-lang.org/tools/install))
- **Bun** 1.3+ ([install](https://bun.sh))
- **Node.js** 18+ (optional, Bun can be used instead)

### Setup

```bash
# Clone repository
git clone <repository-url>
cd starter-rust-webuiangular-rspack

# Install frontend dependencies
cd frontend
bun install

# Build and run
cd ..
./run.sh
```

### Platform-Specific Requirements

#### Linux
```bash
# WebKit2GTK (required for WebUI)
sudo apt install libwebkit2gtk-4.1-dev  # Debian/Ubuntu
sudo dnf install webkit2gtk4.1-devel   # Fedora
```

#### macOS
```bash
# Xcode Command Line Tools
xcode-select --install
```

#### Windows
```bash
# Visual Studio Build Tools
# WebView2 runtime (included in Windows 10+)
```

---

## 🔧 Configuration

### Application Config (`config/app.config.toml`)

```toml
[app]
name = "Rust WebUI SQLite Demo"
version = "1.0.0"

[window]
title = "Rust WebUI Application"
width = 1280
height = 800

[database]
path = "app.db"
create_sample_data = true

[logging]
level = "info"
file = "logs/application.log"
append = true

[communication]
transport = "webview_ffi"
serialization = "json"
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `RUST_LOG` | Log level | `info` |
| `RUSTWEBUI_DIST_DIR` | Custom dist directory | `./dist` |

---

## 🧪 Testing

### Backend Tests

```bash
cd frontend
cargo test
```

### Frontend Tests

```bash
cd frontend
bun run test
```

### Linting

```bash
cd frontend
bun run lint      # Check
bun run lint:fix  # Auto-fix
```

### Formatting

```bash
cd frontend
bun run format      # Check
bun run format:fix  # Auto-fix
```

---

## 🚀 Deployment

### Development Build

```bash
./run.sh --build
```

### Release Build

```bash
./run.sh --release
```

### Distribution Package

```bash
./build-dist.sh build-release
```

Output will be in `target/release/` with platform-specific packaging.

---

## 🐛 Troubleshooting

### Common Issues

#### Build Fails with "module not found"
```bash
# Clean and rebuild
./run.sh --clean
./run.sh --rebuild
```

#### Frontend Build Errors
```bash
# Reinstall dependencies
cd frontend
rm -rf node_modules bun.lock
bun install
```

#### Database Errors
```bash
# Remove and recreate database
rm app.db
./run.sh
```

#### WebUI Window Not Showing
- Ensure WebKit2GTK is installed (Linux)
- Check WebView2 runtime (Windows)
- Verify port is not in use

### Getting Help

1. Check [documentation](docs/)
2. Review [ERROR_HANDLING_GUIDE.md](ERROR_HANDLING_GUIDE.md)
3. Inspect application logs in `logs/application.log`
4. Check DevTools panel for runtime errors

---

## 📝 License

MIT License - See [LICENSE](LICENSE) file for details.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

### Code Quality Standards

- All code must pass `bun run lint` and `bun run format`
- Backend code must pass `cargo clippy`
- New features should include tests
- Documentation should be updated for API changes

---

## 📊 Performance Benchmarks

| Metric | Value | Notes |
|--------|-------|-------|
| Frontend Build Time | ~30s | Production build |
| Backend Build Time | ~45s | Debug profile |
| Cold Start Time | ~2s | First launch |
| Memory Usage | ~50MB | Idle application |
| Event Bus Throughput | 10,000+ events/sec | Benchmark test |

---

## 🎯 Roadmap

### Completed
- ✅ Clean Architecture implementation
- ✅ MVVM frontend pattern
- ✅ Connection pooling (r2d2)
- ✅ Enhanced error handling
- ✅ DevTools panel
- ✅ Biome linting setup

### In Progress
- 🔄 Integration testing framework
- 🔄 Performance monitoring
- 🔄 Plugin marketplace

### Planned
- ⏳ WebSocket transport layer
- ⏳ Multi-window support
- ⏳ Theme customization
- ⏳ Auto-update mechanism

---

**Built with ❤️ using Rust and Angular**
