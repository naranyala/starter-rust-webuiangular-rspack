# Getting Started

## Prerequisites

### Required Tools

#### Rust
- Version: Latest stable
- Installation: https://rustup.rs/
- Verification: `rustc --version`

#### Bun
- Version: Latest
- Installation: https://bun.sh/
- Verification: `bun --version`

#### Node.js (alternative to Bun)
- Version: 18 or later
- Installation: https://nodejs.org/

#### C Compiler
- Linux: GCC or Clang
- macOS: Xcode Command Line Tools
- Windows: Visual Studio Build Tools

### System Dependencies

#### Linux (Ubuntu/Debian)
```bash
sudo apt-get update
sudo apt-get install -y \
    libwebkit2gtk-4.0-dev \
    libgtk-3-dev \
    libjavascriptcoregtk-4.0-dev \
    libsoup2.4-dev \
    build-essential
```

#### Linux (Fedora)
```bash
sudo dnf install -y \
    webkit2gtk3-devel \
    gtk3-devel \
    javascriptcoregtk4.0-devel \
    libsoup2.4-devel \
    gcc
```

#### macOS
```bash
xcode-select --install
```

#### Windows
- Install Visual Studio Build Tools
- Ensure WebView2 is installed (included in Windows 10+)

## Installation

### Clone Repository
```bash
git clone <repository-url>
cd starter-rust-webuiangular-rspack
```

### Verify Prerequisites
```bash
# Check Rust
rustc --version
cargo --version

# Check Bun
bun --version

# Check C compiler
gcc --version  # or clang --version
```

### First Run
```bash
# Build and run the application
./run.sh
```

The script will:
1. Install frontend dependencies
2. Build frontend assets
3. Compile Rust backend
4. Launch the application

## Building

### Development Build
```bash
# Build and run
./run.sh

# Build only
./run.sh --build

# Build frontend only
./run.sh --build-frontend

# Build Rust only
./run.sh --build-rust

# Clean and rebuild
./run.sh --clean && ./run.sh
```

### Production Build
```bash
# Build optimized release
./run.sh --release

# Create distribution package
./build-dist.sh build-release
```

### Distribution Package
```bash
# Build for current platform
./build-dist.sh build

# Build release distribution
./build-dist.sh build-release
```

## Configuration

### Application Configuration

Edit `app.config.toml`:

```toml
[app]
name = "My Application"
version = "1.0.0"

[window]
title = "My App"
width = 1200
height = 800

[logging]
level = "info"
file = "application.log"
```

### Environment Variables

```bash
# Override log level
export RUST_LOG=debug
./run.sh

# Custom config path
export APP_CONFIG=/path/to/config.toml
./run.sh
```

## Development Workflow

### Daily Development
```bash
# Terminal 1: Run application
./run.sh

# Terminal 2: Edit code
# Changes to frontend will auto-rebuild
# Changes to backend require restart
```

### Debugging

#### Backend Debugging
```bash
# Run with debug symbols
cargo build

# Use gdb/lldb
gdb ./target/debug/app

# View logs
tail -f application.log
```

#### Frontend Debugging
```bash
# Enable dev tools in app.config.toml
[features]
dark_mode = true

# Open browser dev tools (if supported)
# Or use console logging
```

### Testing
```bash
# Run backend tests
cargo test

# Run frontend tests
cd frontend && npm test
```

## Common Tasks

### Add New Feature

1. Create domain entity:
```bash
# src/core/domain/entities/my_feature.rs
```

2. Create application handler:
```bash
# src/core/application/handlers/my_feature_handlers.rs
```

3. Register WebUI binding:
```bash
# src/core/presentation/webui/handlers/my_feature_handlers.rs
```

4. Add frontend component:
```bash
# frontend/src/views/my-feature/
```

### Add Database Table

1. Update schema in `src/core/infrastructure/database/connection.rs`:
```rust
conn.execute(
    "CREATE TABLE IF NOT EXISTS my_table (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL
    )",
    [],
)?;
```

2. Add entity in `src/core/domain/entities/mod.rs`:
```rust
pub struct MyEntity {
    pub id: i64,
    pub name: String,
}
```

3. Add repository methods in `src/core/infrastructure/database/`

### Add New Endpoint

1. Backend handler:
```rust
window.bind("my_endpoint", |event| {
    let response = json!({
        "success": true,
        "data": "Hello from Rust!"
    });
    send_response(window, "my_response", &response);
});
```

2. Frontend call:
```javascript
const result = await window.WebUIBridge.callRustFunction('my_endpoint', {});
console.log(result.data);
```

## Troubleshooting

### Build Fails

**Error: WebUI compilation fails**
```bash
# Clean and rebuild
cargo clean
./run.sh --clean
./run.sh
```

**Error: Frontend build fails**
```bash
# Clear node modules
rm -rf frontend/node_modules
cd frontend && bun install
./run.sh --build-frontend
```

**Error: Missing system dependencies**
```bash
# Linux
sudo apt-get install libwebkit2gtk-4.0-dev

# macOS
xcode-select --install
```

### Runtime Issues

**Application crashes on startup**
1. Check application.log for errors
2. Verify WebView is installed
3. Check system requirements

**Database errors**
1. Delete app.db to reset database
2. Check file permissions
3. Verify database path in config

**Frontend not loading**
1. Check static/ directory has files
2. Verify index.html paths
3. Rebuild frontend: `./run.sh --build-frontend`

### Performance Issues

**Slow startup**
- Use release build: `./run.sh --release`
- Reduce dependencies
- Optimize database queries

**High memory usage**
- Check for memory leaks
- Reduce data loaded at startup
- Implement pagination

## Next Steps

After getting started:

1. Read [Architecture](02-architecture.md) to understand the codebase
2. Review [Project Structure](08-project-structure.md) for repository layout
3. Check [Communication](04-communication.md) for frontend-backend interaction
4. Explore [Dependencies](05-dependencies.md) for available libraries
5. Review [Improvements](06-improvements.md) for enhancement ideas

## Resources

- Rust Documentation: https://doc.rust-lang.org/
- WebUI Documentation: https://github.com/webui-dev/rust-webui
- SQLite Documentation: https://www.sqlite.org/docs.html
- Angular Documentation: https://angular.dev/
- Bun Documentation: https://bun.sh/docs
