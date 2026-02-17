# Build System

## Build Pipeline Overview

The project uses a sophisticated build pipeline orchestrated by multiple scripts and tools:

### Master Build Script (run.sh)

The main entry point for building and running the application.

**Usage:**
```bash
./run.sh                    # Build and run in development mode
./run.sh --release          # Build optimized release version
./run.sh --build            # Build only (frontend + backend)
./run.sh --build-frontend   # Build frontend only
./run.sh --clean            # Clean all build artifacts
./run.sh --help             # Show help message
```

### Frontend Build (build-frontend.js)

JavaScript-based frontend build orchestration using Bun and Rspack.

**Features:**
- Dependency installation with Bun
- Production build with Rspack
- Asset copying to static directory
- WebUI bridge library compilation
- Index.html patching with correct paths

**Build Steps:**
1. Install dependencies with Bun
2. Run Rspack production build
3. Copy static assets to root directory
4. Build WebUI bridge library
5. Patch index.html with correct paths

### Rust Build Script (build.rs)

Rust build script that compiles C dependencies during the build process.

**Responsibilities:**
- Compile WebUI C library
- Compile CivetWeb embedded web server
- Generate build configuration from app.config.toml
- Set up linker flags for native dependencies
- Watch for file changes during development

**Generated Configuration:**
- Package name and version
- Executable name
- Default log level
- Default log file path

### Post-Build Script (post-build.sh)

Handles post-build processing and executable preparation.

**Features:**
- Executable renaming based on configuration
- Platform-specific post-processing
- Distribution preparation

### Distribution Builder (build-dist.sh)

Cross-platform distribution package builder.

**Usage:**
```bash
./build-dist.sh build         # Build distribution package
./build-dist.sh build-release # Build release distribution
./build-dist.sh clean         # Clean distribution artifacts
```

## Configuration System

### Application Configuration (app.config.toml)

TOML-based configuration file controlling application behavior.

**Sections:**

#### [app]
- name: Application name
- version: Version string
- description: Application description
- author: Author information
- website: Project website URL

#### [executable]
- name: Custom binary name (leave empty for default)

#### [database]
- path: SQLite database file path
- create_sample_data: Whether to create sample data on first run

#### [window]
- title: Window title
- width: Initial window width
- height: Initial window height
- min_width: Minimum window width
- min_height: Minimum window height
- resizable: Whether window is resizable

#### [logging]
- level: Log level (debug, info, warn, error)
- file: Log file name (empty to disable file logging)
- append: Append to existing log file or overwrite

#### [features]
- dark_mode: Enable dark mode
- show_tray_icon: Show system tray icon

### Configuration Loading

Configuration is loaded at application startup:

1. Check for app.config.toml in project root
2. Check for config/app.config.toml
3. Fall back to default configuration if not found
4. Register configuration in DI container

### Environment Variables

Runtime configuration can be overridden via environment variables:

- RUST_LOG: Override log level
- Custom variables for feature flags

## Build Workflows

### Development Workflow

```bash
# Initial setup
./run.sh

# After code changes
./run.sh --build

# View logs
tail -f application.log
```

### Production Build

```bash
# Build optimized release
./run.sh --release

# Create distribution package
./build-dist.sh build-release
```

### Clean Build

```bash
# Clean all artifacts
./run.sh --clean

# Rebuild from scratch
./run.sh
```

## Build Output

### Development Build
- Binary: target/debug/rustwebui-app
- Frontend: static/js/, static/css/
- Logs: application.log

### Release Build
- Binary: target/release/rustwebui-app
- Optimized with LTO
- Smaller binary size

### Distribution Package
- Platform-specific executable
- Required runtime files
- Configuration templates

## Prerequisites

### Required Tools
- Rust (latest stable)
- Bun (JavaScript runtime)
- GCC/Clang (C compiler)

### System Dependencies

#### Linux
- libwebkit2gtk-4.0-dev
- libgtk-3-dev
- libjavascriptcoregtk-4.0-dev
- libsoup2.4-dev

#### macOS
- Xcode Command Line Tools
- WebView framework (included)

#### Windows
- Visual Studio Build Tools
- WebView2 (included in Windows 10+)

## Troubleshooting

### Common Build Issues

**WebUI compilation fails:**
- Ensure GCC/Clang is installed
- Check thirdparty/webui-c-src/ directory exists
- Run: cargo clean && ./run.sh

**Frontend build fails:**
- Ensure Bun is installed: bun --version
- Clear node_modules: rm -rf frontend/node_modules
- Reinstall: cd frontend && bun install

**Configuration not loaded:**
- Check app.config.toml syntax
- Verify file location (root or config/)
- Check file permissions

## Build Performance

### Optimization Tips
- Use --release for production builds
- Enable LTO in Cargo.toml for smaller binaries
- Use incremental compilation for development
- Cache Bun dependencies

### Build Times
- Development build: ~30-60 seconds
- Release build: ~2-5 minutes
- Frontend only: ~5-10 seconds
