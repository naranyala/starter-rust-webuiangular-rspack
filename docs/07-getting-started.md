# Getting Started

## Prerequisites

### Required Software

| Software | Version | Installation |
|----------|---------|--------------|
| **Rust** | 1.93+ | `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \| sh` |
| **Bun** | 1.3+ | `curl -fsSL https://bun.sh/install \| bash` |
| **Git** | Latest | Package manager |

### Platform Requirements

#### Linux (Ubuntu/Debian)
```bash
# WebKit2GTK for WebUI
sudo apt update
sudo apt install libwebkit2gtk-4.1-dev build-essential

# Optional: Additional development tools
sudo apt install pkg-config libssl-dev libsqlite3-dev
```

#### Linux (Fedora)
```bash
sudo dnf install webkit2gtk4.1-devel gcc gcc-c++ make
```

#### macOS
```bash
# Xcode Command Line Tools
xcode-select --install
```

#### Windows
```bash
# Visual Studio Build Tools 2019+
# Download from: https://visualstudio.microsoft.com/downloads/
# Select "Desktop development with C++"

# WebView2 (included in Windows 10+)
```

## Installation

### Step 1: Clone Repository

```bash
git clone <repository-url>
cd starter-rust-webuiangular-rspack
```

### Step 2: Install Frontend Dependencies

```bash
cd frontend
bun install
cd ..
```

### Step 3: Verify Installation

```bash
# Check Rust version
rustc --version  # Should be 1.93+

# Check Bun version
bun --version  # Should be 1.3+

# Check Cargo
cargo --version
```

## Quick Start

### Run Development Build

```bash
./run.sh
```

This will:
1. Check prerequisites
2. Install frontend dependencies
3. Build frontend with Rspack
4. Build Rust backend
5. Launch application

**First build time**: ~2-3 minutes  
**Subsequent builds**: ~30 seconds

### Access DevTools

Once application opens:
1. Look for bottom status bar
2. Click the toggle (⌃) to expand
3. Click **DevTools** tab (🛠️)
4. Explore backend/frontend internals

## Build Commands

### Standard Builds

```bash
./run.sh --build            # Build everything
./run.sh --build-frontend   # Build frontend only
./run.sh --build-rust       # Build backend only
./run.sh --release          # Optimized release build
```

### Run Commands

```bash
./run.sh --run              # Run existing build
./run.sh                    # Build + run (default)
```

### Maintenance Commands

```bash
./run.sh --clean            # Clean build artifacts
./run.sh --rebuild          # Clean + rebuild
./run.sh --help             # Show all options
```

## Frontend Development

### Development Server (Standalone)

```bash
cd frontend

# Start Rspack dev server with HMR
bun run dev

# Or use serve:rspack
bun run serve:rspack
```

Access at: `http://localhost:4200`

### Build Frontend

```bash
# Production build
bun run build:rspack

# Or use Angular CLI
bun run build
```

### Code Quality

```bash
# Lint
bun run lint          # Check
bun run lint:fix      # Auto-fix

# Format
bun run format        # Check
bun run format:fix    # Auto-fix

# Both
bun run check         # Check both
bun run check:fix     # Fix both
```

## Backend Development

### Build Backend

```bash
# Debug build (fast, with debug info)
cargo build

# Release build (optimized)
cargo build --release

# Check without building
cargo check
```

### Run Backend (Standalone)

```bash
# Run debug build
cargo run

# Run release build
cargo run --release

# Run with logging
RUST_LOG=debug cargo run
```

### Run Tests

```bash
# All tests
cargo test

# Specific test
cargo test test_database_init

# With output
cargo test -- --nocapture
```

### Code Quality

```bash
# Check code
cargo clippy

# Auto-fix
cargo clippy --fix

# Format code
cargo fmt

# Check format
cargo fmt -- --check
```

## Configuration

### Application Config

Edit `config/app.config.toml`:

```toml
[app]
name = "Rust WebUI SQLite Demo"
version = "1.0.0"

[window]
title = "My Application"
width = 1280
height = 800

[database]
path = "app.db"
create_sample_data = true

[logging]
level = "info"  # debug, info, warn, error
file = "logs/application.log"
append = true
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `RUST_LOG` | Log level | `info` |
| `RUSTWEBUI_DIST_DIR` | Custom dist directory | `./dist` |

Set environment variable:
```bash
export RUST_LOG=debug
./run.sh
```

## Troubleshooting

### Build Fails

**Problem**: "module not found" or dependency errors

**Solution**:
```bash
# Clean everything
./run.sh --clean

# Reinstall frontend dependencies
cd frontend && rm -rf node_modules bun.lock && bun install

# Rebuild
cd .. && ./run.sh --rebuild
```

### Frontend Build Errors

**Problem**: TypeScript errors or build failures

**Solution**:
```bash
cd frontend

# Clear cache
rm -rf dist .angular

# Reinstall
rm -rf node_modules bun.lock
bun install

# Rebuild
bun run build:rspack
```

### Backend Build Errors

**Problem**: Rust compilation errors

**Solution**:
```bash
# Update Rust
rustup update

# Clear build cache
cargo clean

# Rebuild
cargo build
```

### Database Errors

**Problem**: "database locked" or SQLite errors

**Solution**:
```bash
# Close application
# Remove database file
rm app.db

# Restart
./run.sh
```

### WebUI Window Not Showing

**Problem**: Application runs but no window appears

**Linux Solution**:
```bash
# Install WebKit2GTK
sudo apt install libwebkit2gtk-4.1-dev
```

**Windows Solution**:
```bash
# Ensure WebView2 is installed
# (Included with Windows 10+)
```

**macOS Solution**:
```bash
# Ensure Xcode tools installed
xcode-select --install
```

### Port Already in Use

**Problem**: "Address already in use" error

**Solution**:
```bash
# Find process using port 38803 (default)
lsof -i :38803

# Kill process
kill -9 <PID>

# Or use different port
export RUSTWEBUI_PORT=38804
./run.sh
```

### Performance Issues

**Problem**: Slow builds or application

**Solutions**:
1. **Enable incremental compilation** (already enabled by default)
2. **Use release mode for testing**: `./run.sh --release`
3. **Close other applications** to free memory
4. **SSD recommended** for faster I/O

## Next Steps

After successful installation:

1. **Explore DevTools** - Bottom panel → DevTools tab
2. **Read Architecture** - [02-architecture.md](02-architecture.md)
3. **Review Project Structure** - [08-project-structure.md](08-project-structure.md)
4. **Try Demo Features** - Click cards in main view
5. **Check Error Handling** - Trigger test errors in DevTools

## Getting Help

- **Documentation**: Browse `/docs` folder
- **Error Guide**: [ERROR_HANDLING_GUIDE.md](../ERROR_HANDLING_GUIDE.md)
- **Logs**: Check `logs/application.log`
- **DevTools**: Use built-in DevTools panel

## Common Workflows

### Daily Development

```bash
# Morning: Start development
./run.sh

# During day: Iterative changes
# Edit files → Save → App auto-reloads (frontend)

# Evening: Run tests
cd frontend && bun run test
cd .. && cargo test

# End of day: Clean build
./run.sh --clean
```

### Preparing Release

```bash
# 1. Run all tests
cargo test && cd frontend && bun run test

# 2. Run linting
cargo clippy && bun run lint

# 3. Build release
./run.sh --release

# 4. Create distribution
./build-dist.sh build-release
```

### Debugging Issues

```bash
# 1. Enable debug logging
export RUST_LOG=debug
./run.sh

# 2. Check logs
tail -f logs/application.log

# 3. Use DevTools
# Open DevTools panel → Backend tab → View logs

# 4. Trigger test errors
# DevTools → Actions → Test Scenarios
```

---

**Ready to code?** Continue to [Architecture](02-architecture.md) →
