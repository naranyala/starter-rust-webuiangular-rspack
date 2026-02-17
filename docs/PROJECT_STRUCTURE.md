# Project Structure

## Current Directory Layout

```
rustwebui-app/
├── # Build & Run Scripts (in root for easy access)
├── run.sh                  # Main build and run script
├── build-dist.sh          # Distribution build script
├── build-frontend.js      # Frontend build script
├── post-build.sh          # Post-build operations
├── build.rs               # Cargo build script
│
├── # Configuration
├── Cargo.toml             # Rust dependencies
├── Cargo.lock             # Locked dependencies
├── config/
│   └── app.config.toml   # Application configuration
│
├── # Source Code
├── src/
│   ├── main.rs           # Application entry point
│   ├── core/             # Core application (MVVM)
│   │   ├── domain/       # Business entities
│   │   ├── application/  # Business logic
│   │   ├── infrastructure/ # External implementations
│   │   │   ├── database/ # Database module (split)
│   │   │   ├── logging/  # Logging module (split)
│   │   │   ├── config.rs
│   │   │   ├── di.rs
│   │   │   └── event_bus.rs
│   │   └── presentation/ # UI layer
│   └── utils/            # Shared utilities
│       ├── compression/
│       ├── crypto/
│       ├── encoding/
│       ├── serialization/
│       └── ...
│
├── # Frontend
├── frontend/              # Vue.js/Rspack frontend
├── static/                # Static assets (built)
│
├── # Documentation
├── README.md
├── docs/                  # Additional documentation
│
├── # Data & Logs
├── app.db                 # SQLite database
├── application.log        # Application log
│
└── # Other
├── index.html            # Root HTML
├── test.html             # Test page
├── examples/             # Example code
└── thirdparty/           # Third-party code
```

## Scripts

All build and run scripts are in the **root directory** for easy access:

| Script | Purpose |
|--------|---------|
| `./run.sh` | Main build and run script |
| `./build-dist.sh` | Build distribution package |
| `./build-frontend.js` | Build frontend with Rspack |
| `./post-build.sh` | Post-build operations |

### Usage

```bash
# Build and run application
./run.sh

# Build only
./run.sh --build

# Build frontend only
./run.sh --build-frontend

# Show help
./run.sh --help
```

## Source Code Organization

### Core Modules (`src/core/`)

Following MVVM pattern:

- **domain/** - Business entities and traits
- **application/** - Use cases and business logic
- **infrastructure/** - External implementations (DB, logging, config)
- **presentation/** - UI layer (WebUI handlers)

### Utilities (`src/utils/`)

Shared utility modules:

- `compression/` - Compression algorithms
- `crypto/` - Cryptography functions
- `encoding/` - Encoding utilities
- `serialization/` - JSON, MessagePack, CBOR
- `system/` - System utilities
- `validation/` - Validation functions
- And more...

## Module Splitting

Large files have been split into smaller modules:

| Original | Split Into | Status |
|----------|-----------|--------|
| `database.rs` (376L) | `database/` (4 files) | ✅ |
| `logging.rs` (197L) | `logging/` (4 files) | ✅ |

## Configuration

Configuration files are in `config/` directory:

```bash
config/app.config.toml  # Application settings
```

The application also checks the root directory for backward compatibility.

## Build Output

- **Binary**: `target/debug/rustwebui-app` (debug) or `target/release/rustwebui-app` (release)
- **Frontend**: `frontend/static/` and `static/`
- **Logs**: `application.log`
