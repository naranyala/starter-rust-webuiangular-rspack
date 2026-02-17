# Build Output Locations

## Overview

The application now organizes build outputs and runtime files in dedicated directories for better project organization.

## Directory Structure

```
project-root/
├── dist/                     # Final build output (production)
│   ├── index.html           # Main HTML file
│   └── static/              # Static assets
│       ├── js/              # JavaScript files
│       └── css/             # CSS files
│
├── target/                   # Rust build artifacts
│   └── release/             # Release build
│       ├── app              # Executable (Linux/macOS)
│       └── logs/            # Application logs
│
├── logs/                     # Development logs (when running from root)
│   └── application.log
│
└── frontend/
    └── dist/                # Rspack build output (intermediate)
```

## Log File Location

### Development Mode
When running from the project root during development:
```
project-root/logs/application.log
```

### Production Mode
When running the compiled executable:
```
<executable-directory>/logs/application.log
```

For example:
- Linux: `target/release/logs/application.log`
- macOS: `target/release/logs/application.log`
- Windows: `target/release/logs/application.log`

### Configuration

The log file path is configured in `config/app.config.toml`:

```toml
[logging]
level = "info"
file = "logs/application.log"
append = true
```

To use an absolute path:
```toml
[logging]
file = "/var/log/myapp/application.log"
```

## Build Output

### Frontend Build

The frontend build process creates output in two locations:

1. **Intermediate**: `frontend/dist/` - Rspack build output
2. **Final**: `dist/` - Production-ready files

The `dist/` directory contains:
- `index.html` - Main HTML file with correct paths
- `static/js/` - Compiled JavaScript files
- `static/css/` - Compiled CSS files

### Backend Build

The Rust backend compiles to:
- Debug: `target/debug/rustwebui-app`
- Release: `target/release/app` (or custom name from config)

## Running the Application

### Development
```bash
# Build and run
./run.sh

# Logs will be in:
# - project-root/logs/application.log
# - Console output
```

### Production
```bash
# Build release
./run.sh --release

# Executable location:
# - target/release/app

# Logs will be in:
# - target/release/logs/application.log
```

### Distribution
```bash
# Create distribution package
./build-dist.sh build-release

# Distribution includes:
# - dist/ (frontend assets)
# - app (executable)
# - config/app.config.toml
# - logs/ directory (created at runtime)
```

## File Locations Summary

| File Type | Development | Production |
|-----------|-------------|------------|
| Executable | `target/debug/rustwebui-app` | `target/release/app` |
| Frontend | `dist/` | `dist/` (bundled) |
| Logs | `logs/application.log` | `<exe-dir>/logs/application.log` |
| Database | `app.db` (root) | `<exe-dir>/app.db` |
| Config | `config/app.config.toml` | `<exe-dir>/config/app.config.toml` |

## Benefits

1. **Clean Project Root**: Build outputs don't clutter the root directory
2. **Portable Logs**: Logs travel with the executable
3. **Easy Cleanup**: Remove `dist/` and `target/` for clean build
4. **Production Ready**: Distribution package has all files in correct locations
5. **Development Friendly**: Root `logs/` directory for easy access during development

## Migration Notes

If you have existing files in the root directory:

```bash
# Move old log file
mv application.log logs/

# Old static files can be removed (now in dist/)
rm -rf static/

# Old index.html can be removed (now in dist/)
rm index.html
```

## Troubleshooting

### Logs not appearing

1. Check `config/app.config.toml` for correct path
2. Ensure `logs/` directory has write permissions
3. Check application console output for errors

### Frontend not loading

1. Verify `dist/` directory exists
2. Check `dist/index.html` has correct paths to `../static/`
3. Rebuild frontend: `./run.sh --build-frontend`

### Database not found

The database file location is configured in `config/app.config.toml`:

```toml
[database]
path = "app.db"  # Relative to executable
```

For absolute path:
```toml
[database]
path = "/var/lib/myapp/app.db"
```
