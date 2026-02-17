# Project Restructuring Plan

## Current Issues
1. Mixed module organization (some with subdirs, some without)
2. Legacy code mixed with new code in `shared/legacy.rs`
3. Infrastructure has both files and directories at same level
4. Documentation scattered in root directory
5. Too many dependencies in Cargo.toml without clear organization
6. Build scripts and shell scripts in root

## New Structure

```
rustwebui-app/
├── Cargo.toml                  # Dependencies organized by category
├── build.rs                    # Build script
├── README.md                   # Main documentation
├── .gitignore
│
├── config/                     # Configuration files
│   ├── app.config.toml        # Application config
│   └── default.config.toml    # Default configuration template
│
├── src/
│   ├── main.rs                # Application entry point
│   ├── lib.rs                 # Library root (for testing)
│   │
│   ├── core/                  # Core application logic (MVVM pattern)
│   │   ├── mod.rs
│   │   ├── domain/            # Business entities
│   │   │   ├── mod.rs
│   │   │   ├── entities/      # Data structures
│   │   │   └── traits/        # Domain traits
│   │   ├── application/       # Use cases & business logic
│   │   │   ├── mod.rs
│   │   │   ├── services/      # Application services
│   │   │   └── handlers/      # Business logic handlers
│   │   ├── infrastructure/    # External implementations
│   │   │   ├── mod.rs
│   │   │   ├── config/        # Configuration management
│   │   │   ├── database/      # Database layer
│   │   │   ├── di/            # Dependency injection
│   │   │   ├── event_bus/     # Event system
│   │   │   └── logging/       # Logging system
│   │   └── presentation/      # UI layer
│   │       ├── mod.rs
│   │       └── webui/         # WebUI handlers
│   │           ├── mod.rs
│   │           └── handlers/  # UI event handlers
│   │
│   └── utils/                 # Shared utilities
│       ├── mod.rs
│       ├── compression/       # Compression utilities
│       ├── crypto/            # Cryptography utilities
│       ├── encoding/          # Encoding utilities
│       ├── network/           # Network utilities
│       ├── serialization/     # Serialization (JSON, MessagePack, CBOR)
│       ├── system/            # System utilities
│       └── validation/        # Validation utilities
│
├── frontend/                   # Frontend code
│   ├── src/
│   ├── static/
│   ├── package.json
│   └── rspack.config.ts
│
├── scripts/                    # Build and utility scripts
│   ├── build-frontend.js
│   ├── build-dist.sh
│   ├── post-build.sh
│   └── run.sh
│
├── docs/                       # Documentation
│   ├── architecture.md
│   ├── communication.md
│   ├── serialization.md
│   └── websocket-monitor.md
│
├── examples/                   # Example code
├── thirdparty/                 # Third-party code
└── target/                     # Build artifacts (gitignored)
```

## Key Changes

### 1. Module Reorganization
- Move `domain`, `application`, `infrastructure`, `presentation` under `src/core/`
- Move `shared` to `src/utils/` (cleaner name)
- Remove `legacy.rs` (migrate or remove deprecated code)

### 2. Configuration
- Move config files to `config/` directory
- Update config loading to use relative paths

### 3. Scripts
- Move all shell/JS scripts to `scripts/` directory
- Update paths in scripts accordingly

### 4. Documentation
- Move markdown docs to `docs/` directory
- Create main documentation structure

### 5. Cargo.toml Cleanup
- Organize dependencies by category with comments
- Remove unused dependencies
- Group platform-specific deps

### 6. Build System
- Update `build.rs` to reference new paths
- Update `build-frontend.js` paths

## Migration Steps

1. Create new directory structure
2. Move source files to new locations
3. Update module paths in all files
4. Update Cargo.toml
5. Move configuration files
6. Move scripts
7. Move documentation
8. Update import paths
9. Test build
10. Test application

## Benefits

- ✅ Clear separation of concerns
- ✅ Follows Rust conventions
- ✅ Easier to navigate
- ✅ Better for testing
- ✅ Cleaner root directory
- ✅ Maintains all features
- ✅ MVVM pattern preserved
