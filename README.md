# Rust WebUI Application

A production-ready desktop application framework built with Rust, WebUI, and Vanilla JavaScript, featuring full-stack capabilities including SQLite integration.

## Documentation

### Core Documentation

| Document | Description |
|----------|-------------|
| [Overview](docs/01-overview.md) | Project overview, technology stack, and key features |
| [Architecture](docs/02-architecture.md) | Project structure, MVVM pattern, and component organization |
| [Build System](docs/03-build-system.md) | Build pipeline, configuration, and workflows |
| [Communication](docs/04-communication.md) | Frontend-backend communication architecture |
| [Dependencies](docs/05-dependencies.md) | Complete dependency reference for backend and frontend |
| [Improvements](docs/06-improvements.md) | Potential improvements and enhancement roadmap |
| [Getting Started](docs/07-getting-started.md) | Installation, setup, and development guide |

### Quick Start

```bash
# Clone and run
git clone <repository-url>
cd starter-rust-webuivanilla-rspack
./run.sh
```

### Build Commands

```bash
./run.sh              # Build and run
./run.sh --release    # Production build
./run.sh --build      # Build only
./run.sh --clean      # Clean artifacts
```

### Project Structure

```
starter-rust-webuivanilla-rspack/
├── src/              # Rust backend (MVVM architecture)
├── frontend/         # TypeScript/JavaScript frontend
├── docs/             # Documentation
├── static/           # Runtime assets
├── config/           # Configuration files
└── scripts/          # Build scripts
```

### Key Features

- MVVM architecture pattern
- SQLite database integration
- Bidirectional frontend-backend communication
- Cross-platform support (Windows, macOS, Linux)
- Production-ready build pipeline
- Comprehensive logging system
- Configuration management

### Technology Stack

- **Backend**: Rust with WebUI
- **Frontend**: Vanilla JavaScript/TypeScript
- **Database**: SQLite
- **Build**: Cargo, Bun, Rspack
- **Runtime**: Embedded WebView

### License

MIT License - See LICENSE file for details.
