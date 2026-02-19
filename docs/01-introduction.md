# Introduction

## Project Overview

Build desktop-class software with a modern web UI, a high-performance Rust core, and a codebase designed to scale from prototype to production.

This repository is not a toy scaffold. It is a structured platform for teams who want:

- Rust reliability and performance in the application core
- Angular velocity for rich UI and product iteration
- WebUI-based desktop delivery without heavyweight Electron overhead
- A layered architecture with clean separation of concerns
- A growth path for plugins, shared contracts, and multiple app entrypoints

## Why This Project Is Valuable

Most starter templates optimize for a quick demo. This one optimizes for long-term product delivery.

- It separates domain, application, infrastructure, and presentation on the Rust side
- It embraces MVVM pattern on the Angular frontend with clear separation of models, viewmodels, and views
- It keeps the active frontend and legacy frontend snapshots side-by-side for safe migration
- It includes build orchestration scripts that connect frontend artifacts, static assets, and Rust binaries
- It introduces extension points (core/, plugins/, shared/, apps/) early, so architecture does not collapse as scope grows

## Technology Stack

### Backend
- Rust with WebUI integration
- SQLite (rusqlite) for embedded database
- Serialization stack (serde, serde_json, rmp-serde, serde_cbor)
- Tokio async runtime

### Frontend
- Angular 19
- TypeScript
- WinBox windowing integration
- Rspack bundler

### Build Tools
- Cargo (Rust)
- Angular CLI
- Bun package manager
- Rspack support scripts

### Runtime
- Static asset serving (static/js, static/css)
- Desktop binary
- Local database and log files

## Key Features

- Full MVVM architecture pattern
- Bidirectional frontend-backend communication
- Embedded SQLite database
- Comprehensive logging system
- Configuration management via TOML
- Cross-platform support (Windows, macOS, Linux)
- Production-ready build pipeline
- Event-driven architecture
- Plugin-ready modular structure

## Application Capabilities

- Native desktop application with web technologies
- Real-time data synchronization between frontend and backend
- Database operations with SQLite
- System information monitoring
- Event bus for pub/sub messaging
- Window state management
- Logging with multiple sinks

## Use Cases

This framework is suitable for:

- Desktop applications requiring native performance
- Applications needing offline data storage
- Cross-platform desktop tools
- Admin dashboards and management interfaces
- Data visualization applications
- Utility applications with system integration
- Enterprise internal tools
- Data entry and management applications

## Related Documentation

- [Getting Started](07-getting-started.md) - Installation and quick start guide
- [Architecture](02-architecture.md) - Detailed architecture overview
- [Project Structure](08-project-structure.md) - Repository layout explanation
- [Build System](03-build-system.md) - Build and deployment instructions
- [Communication](04-communication.md) - Frontend-backend communication patterns
- [Dependencies](05-dependencies.md) - Complete dependency reference
- [Improvements](06-improvements.md) - Suggested enhancements
- [Errors as Values](09-errors-as-values.md) - Error handling pattern guide
