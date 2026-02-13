# Rust WebUI Application - Modern Desktop Apps with Rust and Web Technologies

A production-ready desktop application framework built with Rust, WebUI, and Vanilla JavaScript featuring full-stack capabilities including SQLite integration. This project demonstrates how to build elegant, native desktop applications using web technologies while leveraging Rust's performance and safety for backend logic.

## Why This Project?

Modern desktop development often forces you to choose between simplicity and power. This project bridges that gap by combining:

- **Rust**: A systems programming language that delivers exceptional performance and memory safety without garbage collection
- **WebUI**: A lightweight framework that embeds a web browser to render your interface, avoiding the complexity of Electron while maintaining cross-platform compatibility
- **Vanilla JavaScript**: No heavy frameworks - just pure JavaScript that loads fast and has minimal dependencies
- **SQLite**: A zero-configuration, embedded database that requires no external server setup

The result is a desktop application that feels lightweight but packs the capabilities of a full-stack system.

---

## Architecture Overview

This application follows a **hybrid desktop architecture** that separates concerns between frontend and backend while maintaining seamless communication.

### How It Works

The application runs a local web server that serves your frontend files to an embedded WebView window. When you interact with the interface, JavaScript communicates with Rust handlers that process requests and return results. This bidirectional communication enables everything from simple UI interactions to complex database operations.

```
User Interaction → JavaScript → Rust Handler → SQLite → Response → JavaScript → UI Update
```

### Key Components

1. **Rust Backend**: Handles business logic, database operations, system interactions, and serves the frontend
2. **WebUI Framework**: Embeds a web browser (using system WebView on Linux, macOS, and Windows) to render web content in a native window
3. **Vanilla JavaScript Frontend**: Pure JavaScript without frameworks that provides the user interface
4. **SQLite Database**: A self-contained, embedded SQL database (no external dependencies required)

---

## Project Structure

The project is organized into clear layers that separate concerns and maintainability:

```
starter-rust-webuivanilla-rspack/
├── Cargo.lock                        # Locked dependency versions ensuring reproducible builds
├── Cargo.toml                        # Rust project manifest defining name, version, and dependencies
├── app.config.toml                   # Application configuration (database, logging, window settings)
├── app.db                            # SQLite database file (created automatically at runtime)
├── application.log                   # Runtime log file for debugging and monitoring
├── build.rs                          # Rust build script that compiles C dependencies during build
├── build-frontend.js                 # Frontend build orchestration using Bun and Rspack
├── build-dist.sh                     # Cross-platform distribution builder for packaging releases
├── docs/                             # Documentation directory for project notes
├── examples/                         # Example implementations and reference code
├── frontend/                        # Vanilla JavaScript frontend application
│   ├── dist/                        # Build output directory (generated automatically)
│   │   ├── index.html              # Compiled entry HTML file
│   │   └── static/                  # Compiled static assets
│   │       ├── css/                 # Bundled and optimized CSS
│   │       └── js/                  # Bundled and optimized JavaScript
│   ├── src/                        # Frontend source code
│   │   ├── lib/                    # Core JavaScript utilities
│   │   ├── styles/                 # CSS stylesheets organized by component
│   │   ├── types/                  # TypeScript type definitions
│   │   ├── services/              # Frontend services and API clients
│   │   └── App.ts                 # Root application component
│   ├── index.html                  # HTML template for development
│   ├── package.json               # Node.js dependencies and scripts
│   ├── rspack.config.ts           # Production build configuration
│   ├── rspack.config.dev.ts       # Development build configuration
│   └── tsconfig.json              # TypeScript configuration
├── post-build.sh                   # Executable renaming and post-build processing
├── run.sh                          # Master script for building and running the application
├── static/                         # Runtime static files served to WebView
│   ├── css/                        # Compiled CSS available at runtime
│   └── js/                         # Compiled JavaScript available at runtime
├── src/                            # Rust backend source code
│   ├── infrastructure/             # Low-level infrastructure services
│   │   ├── config.rs              # Configuration loading and management
│   │   ├── database.rs            # SQLite database abstraction layer
│   │   ├── di.rs                  # Dependency injection container
│   │   └── logging.rs             # Logging system configuration
│   ├── use_cases/                  # Business logic and event handlers
│   │   └── handlers/              # Request handlers for different features
│   │       ├── api_handlers.rs   # API endpoint handlers
│   │       ├── db_handlers.rs    # Database CRUD operation handlers
│   │       ├── sysinfo_handlers.rs # System information handlers
│   │       └── ui_handlers.rs    # UI event handlers
│   ├── utils/                      # Utility modules for common operations
│   └── main.rs                     # Application entry point and initialization
└── README.md                       # This documentation file
```

---

## Root Directory Files Explained

### Cargo.toml

This is your Rust project's manifest. It defines:

- **Package metadata**: Your application's name, version, and description
- **Dependencies**: External crates your application uses (webui-rs for the UI framework, rusqlite for database, serde for serialization, chrono for dates, and many others)
- **Build dependencies**: Tools needed only during compilation (the `cc` crate for compiling C code, walkdir for directory traversal, toml for config parsing)
- **Release profile**: Optimization settings for production builds including Link Time Optimization (LTO) and codegen units

### build.rs

This build script runs before your Rust code compiles. It:

1. Reads your application configuration to determine the executable name
2. Compiles the WebUI C library using the `cc` crate
3. Sets necessary compiler flags for proper integration
4. Links the compiled static library into your final Rust binary
5. Generates build configuration that your code can access at compile time

This approach means your final executable is fully self-contained with no external library dependencies.

### build-frontend.js

This script orchestrates the frontend build process using Bun (a fast JavaScript runtime) and Rspack (a fast bundler written in Rust). It:

1. Runs the Rspack bundler with your configuration
2. Collects compiled assets from the output directory
3. Copies files to the runtime static directory
4. Updates HTML references to point to the compiled assets

### run.sh

The master script that handles the complete development workflow. Available commands include:

- Running with no arguments builds and launches the application
- `--build` compiles both frontend and backend
- `--build-frontend` compiles only the JavaScript/TypeScript
- `--build-rust` compiles only the Rust backend
- `--release` creates an optimized production build
- `--clean` removes all build artifacts

### app.config.toml

Your application's central configuration file. It controls:

- Application metadata (name, version, author, website)
- Executable naming
- Database location and initialization behavior
- Window dimensions and behavior
- Logging levels and output
- Feature flags for optional functionality

---

## Backend (Rust) Structure

### src/main.rs

The application entry point handles:

1. **Initialization**: Sets up logging and loads configuration
2. **Database setup**: Creates or opens the SQLite database and initializes the schema
3. **Window creation**: Creates the WebUI window that displays your frontend
4. **Handler registration**: Binds JavaScript-callable functions to Rust handlers
5. **Event loop**: Runs the application until all windows close

### src/infrastructure/

This layer provides essential services that your application relies on:

**config.rs**: Parses your TOML configuration file and provides type-safe access to all settings. It also supports environment variable overrides for flexible deployment.

**database.rs**: Abstracts SQLite operations behind a clean API. It manages a thread-safe connection pool, initializes your database schema on first run, and provides methods for common operations like querying users, creating records, and executing arbitrary SQL. Results are automatically serialized to JSON for easy consumption by the frontend.

**logging.rs**: Configures the logging system based on your preferences. It supports file output, console output, and configurable log levels (debug, info, warn, error).

**di.rs**: Implements a simple dependency injection container for managing service instances across your application.

### src/use_cases/handlers/

These handlers respond to events from your frontend:

**db_handlers.rs**: Processes database operations. When JavaScript requests user data, this handler queries SQLite and returns formatted results. It handles getting users, creating new users, updating existing records, deleting records, and retrieving database statistics.

**sysinfo_handlers.rs**: Gathers and returns system information including operating system details, memory usage, CPU information, disk space, and system uptime.

**ui_handlers.rs**: Manages UI-related events like window initialization and theme configuration.

**api_handlers.rs**: Handles various API endpoints for different application features.

### src/utils/

Utility modules providing common functionality:

- **system.rs**: System information retrieval and hardware detection
- **crypto.rs**: Cryptographic operations including hashing functions
- **network.rs**: Network interface detection and IP address retrieval
- **file.rs**: File system operations and path manipulation
- **validation.rs**: Input validation utilities for emails and other formats

---

## Frontend (Vanilla JavaScript) Structure

### frontend/src/main.ts

The frontend entry point initializes:

1. The application by mounting the root component
2. The WebUI bridge for communicating with Rust
3. Global services like logging and dependency injection

### frontend/src/lib/

Core utilities that power your frontend:

**webui-bridge.js**: The communication layer between JavaScript and Rust. It provides methods to call Rust functions and dispatch events that handlers can respond to.

**logger.js**: A consistent logging interface that supports multiple log levels and optional backend integration.

**di.js**: JavaScript dependency injection for managing service instances.

### frontend/src/App.ts

The root application component that:

1. Defines the main application layout
2. Manages global state
3. Initializes communication with the Rust backend
4. Renders child components

### frontend/rspack.config.ts

The Rspack bundler configuration for production builds. It handles:

- TypeScript compilation
- CSS processing and optimization
- JavaScript minification and bundling
- Code splitting for optimal loading
- Output to the dist directory

---

## Build System Deep Dive

### The Complete Build Pipeline

**Stage 1: Frontend Compilation**

Your TypeScript and CSS source files pass through Rspack, which compiles, optimizes, and bundles them. The output lands in `frontend/dist/` with hashed filenames for cache busting.

**Stage 2: Asset Preparation**

The build-frontend.js script copies compiled assets to the runtime `static/` directory and ensures the root `index.html` references the correct files.

**Stage 3: Rust Compilation**

Cargo compiles your Rust source along with any C dependencies. The build.rs script handles the C compilation and linking automatically.

**Stage 4: Post-Processing**

The post-build script renames your executable according to your configuration and verifies that linking was successful.

**Stage 5: Distribution**

For release builds, the build-dist.sh script packages everything into a distributable archive.

### Build Tools Required

| Tool | Purpose | Installation |
|------|---------|--------------|
| Rust/Cargo | Backend compilation | rustup.rs |
| Bun | Frontend runtime and package manager | bun.sh |
| GCC/Clang | C compiler for WebUI | System package manager |
| WebKitGTK | WebView runtime (Linux) | System package manager |

---

## Configuration System

The application loads configuration in a specific order, with later sources overriding earlier ones:

1. **Hardcoded defaults**: Sensible built-in defaults for all settings
2. **TOML file**: Your `app.config.toml` takes precedence
3. **Environment variables**: Planned for future flexibility

This approach lets you ship sensible defaults while giving users and deployers full control over behavior.

---

## Communication Between Frontend and Backend

### Calling Rust from JavaScript

```javascript
// JavaScript - Calling a Rust function
webui.call('update_user:1:John:john@example.com:Admin:Active');
```

```rust
// Rust - Handling the call
window.bind("update_user", |event| {
    let parts: Vec<&str> = event.element.split(':').collect();
    // Extract id, name, email, role, status and process
    db.update_user(id, name, email, role, status)?;
});
```

### Receiving Responses in JavaScript

```rust
// Rust - Sending a response
let response = serde_json::json!({
    "success": true,
    "message": "User updated"
});
send_response(window, "user_update_response", &response);
```

```javascript
// JavaScript - Handling the response
window.addEventListener('user_update_response', (e) => {
    const data = e.detail;
    console.log(data.message);
});
```

---

## Getting Started

### Installation Prerequisites

```bash
# Linux (Ubuntu/Debian)
sudo apt install build-essential pkg-config libssl-dev libwebkit2gtk-4.0-dev

# Linux (Arch)
sudo pacman -S rustup base-devel webkit2gtk

# Install Bun
curl -fsSL https://bun.sh/install | bash

# Install Rust
rustup init
rustup default stable
```

### Running the Application

```bash
# Development mode - builds and runs
./run.sh

# Production release build
./run.sh --release

# Create distribution package
./build-dist.sh build-release

# Verify the distribution works
./build-dist.sh verify
```

---

## Why Choose This Architecture?

This project offers several advantages for desktop application development:

**Lightweight**: No Electron means smaller binaries, lower memory usage, and faster startup times.

**Secure**: Rust's memory safety guarantees mean fewer vulnerabilities. The application runs with minimal system access.

**Maintainable**: Pure vanilla JavaScript means no framework migration burden. Your skills transfer directly to any web project.

**Fast**: Rust delivers near-native performance for computational tasks. Rspack compiles JavaScript faster than traditional bundlers.

**Self-Contained**: Single executable with no external runtime dependencies. Easy to distribute and install.

**Flexible**: Full access to both web technologies and system capabilities through Rust.

---

## License

MIT License - See LICENSE file for details.

---

## Additional Resources

- [WebUI Documentation](https://webui.dev/)
- [Rust Programming Language](https://www.rust-lang.org/)
- [SQLite Documentation](https://www.sqlite.org/)
- [Bun Documentation](https://bun.sh/docs)
- [Rspack Documentation](https://rspack.dev/)
