# Build System

> **Note**: This document is being updated. For current build instructions, see:
> - [Getting Started](07-getting-started.md) - Build commands and workflows
> - [README.md](../README.md) - Quick start guide

## Overview

The project uses a multi-stage build pipeline orchestrated by shell scripts and build tools.

## Build Scripts

### run.sh (Main Entry Point)

Located at repository root.

**Usage**:
```bash
./run.sh                    # Build and run
./run.sh --build            # Build only
./run.sh --release          # Release build
./run.sh --clean            # Clean artifacts
```

**Build Steps**:
1. Check prerequisites (Cargo, Bun)
2. Install frontend dependencies
3. Build frontend with Rspack
4. Copy assets to static/
5. Build Rust backend
6. Run post-build processing
7. Launch application

### build-frontend.js

Frontend build orchestration.

**Location**: Repository root

**Responsibilities**:
- Install dependencies with Bun
- Run Angular/Rspack build
- Copy assets to static directory
- Patch index.html with correct paths

### build.rs (Cargo Build Script)

Rust build script for compiling C dependencies.

**Location**: Repository root

**Responsibilities**:
- Compile WebUI C library
- Generate build configuration
- Set linker flags

### post-build.sh

Post-build processing.

**Location**: Repository root

**Responsibilities**:
- Rename executables based on config
- Platform-specific processing

### build-dist.sh

Distribution package builder.

**Location**: Repository root

**Usage**:
```bash
./build-dist.sh build-release
```

## Build Configuration

### Rust (Cargo.toml)

```toml
[profile.release]
opt-level = 3
lto = true
codegen-units = 1
```

### Frontend (rspack.config.js)

```javascript
module.exports = {
  entry: { main: './src/main.ts' },
  output: {
    path: path.resolve(__dirname, 'dist/browser'),
    filename: '[name].[contenthash].js',
  },
  // ... more config
};
```

## Build Output

### Debug Build
```
target/debug/app          # Rust executable
frontend/dist/            # Frontend build
```

### Release Build
```
target/release/app        # Optimized executable
frontend/dist/            # Production frontend
```

## Related Documentation

- [Getting Started](07-getting-started.md) - Build commands
- [Project Structure](08-project-structure.md) - File organization
- [README.md](../README.md) - Quick reference
