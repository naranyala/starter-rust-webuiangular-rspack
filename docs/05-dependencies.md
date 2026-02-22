# Dependencies

> **Note**: For current dependency information, check:
> - `Cargo.toml` (root) - Rust dependencies
> - `frontend/package.json` - Frontend dependencies
> - [Getting Started](07-getting-started.md) - Installation requirements

## Backend Dependencies (Rust)

### Core Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `webui-rs` | git/main | WebUI desktop windowing |
| `rusqlite` | 0.32 | SQLite database |
| `r2d2` | 0.8 | Connection pooling |
| `r2d2_sqlite` | 0.25 | SQLite pool manager |
| `serde` | 1.0 | Serialization framework |
| `serde_json` | 1.0 | JSON serialization |
| `log` | 0.4 | Logging facade |
| `backtrace` | 0.3 | Stack traces |

### Serialization

| Package | Version | Purpose |
|---------|---------|---------|
| `serde_yaml` | 0.9 | YAML serialization |
| `rmp-serde` | 1.3 | MessagePack |
| `serde_cbor` | 0.11 | CBOR format |
| `toml` | 0.8 | TOML parsing |
| `chrono` | 0.4 | Date/time with serde |

### Database

| Package | Version | Purpose |
|---------|---------|---------|
| `rusqlite` | 0.32 | SQLite bindings |
| `r2d2` | 0.8 | Connection pool |
| `r2d2_sqlite` | 0.25 | SQLite pool |

### Error Handling

| Package | Version | Purpose |
|---------|---------|---------|
| `anyhow` | 1.0 | Easy error handling |
| `thiserror` | 1.0 | Custom error types |
| `backtrace` | 0.3 | Stack traces |

### Utilities

| Package | Version | Purpose |
|---------|---------|---------|
| `lazy_static` | 1.4 | Static variables |
| `dirs` | 5.0 | Directory paths |
| `tempfile` | 3.8 | Temporary files |
| `notify` | 6.1 | File watching |
| `open` | 5.0 | Open files/URLs |
| `hostname` | 0.3 | Get hostname |
| `whoami` | 2.1 | User information |
| `num_cpus` | 1.17 | CPU count |

### Cryptography

| Package | Version | Purpose |
|---------|---------|---------|
| `base64` | 0.21 | Base64 encoding |
| `hmac` | 0.12 | HMAC |
| `sha2` | 0.10 | SHA-2 hash |
| `rand` | 0.8 | Random numbers |
| `jsonwebtoken` | 9.0 | JWT tokens |
| `hex` | 0.4 | Hex encoding |
| `md5` | 0.7 | MD5 hash |

### Network

| Package | Version | Purpose |
|---------|---------|---------|
| `url` | 2.5 | URL parsing |
| `reqwest` | 0.12 | HTTP client |

### Compression

| Package | Version | Purpose |
|---------|---------|---------|
| `flate2` | 1.0 | Gzip/Deflate |
| `zstd` | 0.13 | Zstandard |
| `brotli` | 8.0 | Brotli |
| `lz4_flex` | 0.11 | LZ4 |
| `snap` | 1.1 | Snappy |

### File Operations

| Package | Version | Purpose |
|---------|---------|---------|
| `walkdir` | 2.3 | Directory traversal |
| `image` | 0.24 | Image processing |
| `arboard` | 3.4 | Clipboard |
| `ini` | 1.3 | INI parsing |
| `zip` | 0.6 | ZIP archives |
| `tar` | 0.4 | TAR archives |

### System

| Package | Version | Purpose |
|---------|---------|---------|
| `sysctl` | 0.5 | System control |
| `humantime` | 2.1 | Human-readable time |

### Build Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `cc` | 1.0 | C compilation |
| `walkdir` | 2.3 | File traversal |
| `toml` | 0.8 | TOML parsing |

## Frontend Dependencies (Angular)

### Core Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@angular/core` | 21.1.5 | Angular framework |
| `@angular/common` | 21.1.5 | Common directives |
| `@angular/compiler` | 21.1.5 | Template compiler |
| `@angular/forms` | 21.1.5 | Forms handling |
| `@angular/platform-browser` | 21.1.5 | Browser platform |
| `@angular/router` | 21.1.5 | Routing |
| `rxjs` | 7.8.2 | Reactive extensions |
| `zone.js` | 0.15.1 | Change detection |
| `tslib` | 2.8.1 | TypeScript helpers |
| `winbox` | 0.2.82 | Window management |

### Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@angular/cli` | 21.1.4 | Angular CLI |
| `@angular/build` | 21.1.4 | Angular build |
| `@rspack/core` | 1.7.6 | Rspack bundler |
| `@rspack/cli` | 1.7.6 | Rspack CLI |
| `@biomejs/biome` | 2.4.4 | Linter/formatter |
| `typescript` | 5.9.0 | TypeScript |
| `esbuild-loader` | 4.4.2 | Fast TS compilation |
| `sass` | 1.97.3 | SCSS preprocessor |
| `css-loader` | 7.1.4 | CSS processing |
| `style-loader` | 4.0.0 | Style injection |

### Testing Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `protractor` | 7.0.0 | E2E testing |
| `ts-node` | 10.9.2 | TypeScript execution |

## Build Tools

| Tool | Version | Purpose |
|------|---------|---------|
| Rust | 1.93+ | Backend language |
| Cargo | - | Rust package manager |
| Bun | 1.3+ | Frontend package manager |
| Node.js | 18+ | JavaScript runtime (optional) |
| Angular CLI | 21.1.4 | Angular build tool |
| Rspack | 1.7.6 | Bundler |
| Biome | 2.4.4 | Linter/formatter |

## Platform Dependencies

### Linux

| Package | Purpose |
|---------|---------|
| `libwebkit2gtk-4.1-dev` | WebKit for WebUI |
| `build-essential` | Build tools |
| `pkg-config` | Package config |
| `libssl-dev` | SSL/TLS |
| `libsqlite3-dev` | SQLite |

### macOS

| Package | Purpose |
|---------|---------|
| Xcode Command Line Tools | Build tools |
| WebKit | Built-in |

### Windows

| Package | Purpose |
|---------|---------|
| Visual Studio Build Tools | C++ compiler |
| WebView2 | Built-in (Windows 10+) |

## Dependency Updates

### Check for Updates

```bash
# Rust
cargo outdated  # Requires cargo-outdated

# Frontend
bun outdated
```

### Update Dependencies

```bash
# Rust
cargo update

# Frontend
bun update
```

## Related Documentation

- [Getting Started](07-getting-started.md) - Installation
- [Build System](03-build-system.md) - Build process
- [README.md](../README.md) - Quick reference
