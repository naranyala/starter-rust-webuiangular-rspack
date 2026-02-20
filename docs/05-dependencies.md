# Dependencies

## Backend Dependencies (Rust)

### Core Dependencies

#### WebUI
- **Package**: webui-rs
- **Version**: main branch (git)
- **Purpose**: Embed web browser in desktop application
- **Usage**: Window creation, event binding, JavaScript execution

#### Serialization
- **Package**: serde (1.0)
- **Features**: derive
- **Purpose**: Serialization/deserialization framework

- **Package**: serde_json (1.0)
- **Purpose**: JSON serialization

- **Package**: rmp-serde (1.3)
- **Purpose**: MessagePack serialization (alternative to JSON)

- **Package**: serde_cbor (0.11)
- **Purpose**: CBOR serialization (alternative to JSON)

- **Package**: toml (0.8)
- **Purpose**: TOML configuration parsing

- **Package**: serde_yaml (0.9)
- **Purpose**: YAML serialization support

#### Database
- **Package**: rusqlite (0.32)
- **Features**: bundled
- **Purpose**: SQLite database operations

#### Logging
- **Package**: log (0.4)
- **Purpose**: Logging facade

- **Package**: env_logger (0.11)
- **Purpose**: Logging implementation

#### Error Handling
- **Package**: anyhow (1.0)
- **Purpose**: Flexible error handling

- **Package**: thiserror (1.0)
- **Purpose**: Derive macro for error types

#### Date/Time
- **Package**: chrono (0.4)
- **Features**: serde
- **Purpose**: Date and time operations

#### Utilities
- **Package**: lazy_static (1.4)
- **Purpose**: Lazy static initialization

### Security Dependencies

#### Cryptography
- **Package**: base64 (0.21)
- **Purpose**: Base64 encoding/decoding

- **Package**: hmac (0.12)
- **Purpose**: HMAC functions

- **Package**: sha2 (0.10)
- **Purpose**: SHA-2 hash functions

- **Package**: rand (0.8)
- **Purpose**: Random number generation

- **Package**: hex (0.4)
- **Purpose**: Hex encoding/decoding

- **Package**: md5 (0.7)
- **Purpose**: MD5 hashing

#### Authentication
- **Package**: jsonwebtoken (9.0)
- **Purpose**: JWT token handling

- **Package**: url (2.5)
- **Purpose**: URL parsing and validation

### Network Dependencies

- **Package**: reqwest (0.12)
- **Features**: blocking
- **Purpose**: HTTP client

### File Operations

- **Package**: walkdir (2.3)
- **Purpose**: Directory traversal

- **Package**: dirs (5.0)
- **Purpose**: Directory paths

- **Package**: tempfile (3.8)
- **Purpose**: Temporary files

- **Package**: notify (6.1)
- **Purpose**: File system watching

- **Package**: open (5.0)
- **Purpose**: Open files/URLs with default application

### Compression

- **Package**: flate2 (1.0)
- **Purpose**: Gzip compression

- **Package**: zstd (0.13)
- **Purpose**: Zstandard compression

- **Package**: brotli (8.0)
- **Purpose**: Brotli compression

- **Package**: lz4_flex (0.11)
- **Purpose**: LZ4 compression

- **Package**: snap (1.1)
- **Purpose**: Snappy compression

### Archive Formats

- **Package**: zip (0.6)
- **Purpose**: ZIP archive handling

- **Package**: tar (0.4)
- **Purpose**: TAR archive handling

### Image Processing

- **Package**: image (0.24)
- **Purpose**: Image processing

### Clipboard

- **Package**: arboard (3.4)
- **Purpose**: Clipboard access

### Configuration

- **Package**: ini (1.3)
- **Purpose**: INI file parsing

### System Information

- **Package**: sysctl (0.5)
- **Purpose**: System control information

- **Package**: hostname (0.3)
- **Purpose**: Hostname retrieval

- **Package**: whoami (2.1)
- **Purpose**: User information

- **Package**: num_cpus (1.17)
- **Purpose**: CPU count

### Encoding

- **Package**: ascii85 (0.2)
- **Purpose**: Ascii85 encoding

- **Package**: punycode (0.4)
- **Purpose**: Punycode encoding

### Time Formatting

- **Package**: humantime (2.1)
- **Purpose**: Human-readable time formatting

### Platform-Specific Dependencies

#### Windows
- **Package**: winapi (0.3)
- **Features**: winuser, shellapi, processthreadsapi, etc.
- **Purpose**: Windows API access

- **Package**: windows (0.57)
- **Features**: Win32_UI_WindowsAndMessaging, etc.
- **Purpose**: Modern Windows API

- **Package**: winreg (0.52)
- **Purpose**: Windows registry access

#### macOS
- **Package**: objc2 (0.6)
- **Purpose**: Objective-C runtime

- **Package**: objc2-app-kit (0.3)
- **Purpose**: AppKit framework

- **Package**: objc2-foundation (0.3)
- **Purpose**: Foundation framework

## Frontend Dependencies (TypeScript/JavaScript)

### Framework
- **Package**: @angular/core (19.x)
- **Purpose**: Angular framework

- **Package**: @angular/common (19.x)
- **Purpose**: Angular common module

- **Package**: @angular/forms (19.x)
- **Purpose**: Angular forms module

- **Package**: @angular/platform-browser (19.x)
- **Purpose**: Angular platform browser

- **Package**: @angular/router (19.x)
- **Purpose**: Angular router

### Build Tools

- **Package**: typescript
- **Purpose**: TypeScript compiler

- **Package**: @angular-devkit/build-angular
- **Purpose**: Angular build system

- **Package**: @angular/cli
- **Purpose**: Angular CLI

### Development Tools

- **Package**: @biomejs/biome
- **Purpose**: Linter and formatter

### Runtime Libraries

- **Package**: winbox
- **Purpose**: Window management library

## Build Dependencies

### Rust Build

- **Package**: cc (1.0)
- **Purpose**: C compilation for build.rs

- **Package**: walkdir (2.3)
- **Purpose**: File watching in build.rs

- **Package**: toml (0.8)
- **Purpose**: Config parsing in build.rs

## Dependency Organization

### By Functionality

#### Core Application
- webui-rs
- serde, serde_json
- log, env_logger

#### Data Layer
- rusqlite
- chrono

#### Security
- hmac, sha2, rand
- jsonwebtoken

#### System Integration
- sysctl, hostname, whoami
- notify, open, dirs

#### Compression/Archives
- flate2, zstd, brotli
- zip, tar

### Optional Features

Dependencies that could be feature-flagged:
- Image processing (image)
- Archive formats (zip, tar)
- Compression algorithms (zstd, brotli, lz4_flex, snap)
- Clipboard access (arboard)
- Platform-specific (winapi, objc2-*)

## Dependency Management

### Version Pinning

All dependencies are pinned in Cargo.lock for reproducible builds.

### Updates

To update dependencies:
```bash
# Update all dependencies
cargo update

# Update specific dependency
cargo update -p serde

# Check for updates
cargo outdated
```

### Security Audits

```bash
# Install cargo-audit
cargo install cargo-audit

# Run security audit
cargo audit
```

## Dependency Graph

### Core Flow
```
main.rs
  -> core/domain (entities, traits)
  -> core/application (handlers, services)
  -> core/infrastructure (config, database, di, event_bus, logging)
  -> core/presentation (webui handlers)
  -> utils (utilities)
```

### External Services
```
Application
  -> WebUI (window management)
  -> SQLite (data persistence)
  -> Event Bus (messaging)
  -> Logger (logging)
```
