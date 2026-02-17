# File Splitting Plan

## Target Files (>200 lines)

| File | Lines | Action |
|------|-------|--------|
| `database.rs` | 376 | Split into 4 files |
| `db_handlers.rs` | 299 | Split into 3 files |
| `config.rs` | 262 | Split into 3 files |
| `serialization/mod.rs` | 261 | Split into 4 files |
| `main.rs` | 240 | Split into 3 files |
| `sysinfo_handlers.rs` (app) | 213 | Split into 2 files |
| `logging.rs` | 197 | Split into 3 files |

## Split Strategy

### 1. database.rs (376 lines) → `database/` module
```
src/core/infrastructure/database/
├── mod.rs           # Public API & re-exports
├── connection.rs    # Database connection & initialization
├── models.rs        # Data structures (User, QueryResult, DbRow)
├── queries.rs       # Raw query execution
└── users.rs         # User-specific operations
```

### 2. db_handlers.rs (299 lines) → `db_handlers/` module
```
src/core/application/handlers/db_handlers/
├── mod.rs           # Public API & initialization
├── common.rs        # Shared helpers (get_db, send_response)
├── user_handlers.rs # User CRUD handlers
└── product_handlers.rs # Product handlers (if any)
```

### 3. config.rs (262 lines) → `config/` module
```
src/core/infrastructure/config/
├── mod.rs           # Public API & re-exports
├── models.rs        # Config structs (AppConfig, Settings)
├── loader.rs        # Config loading logic
└── defaults.rs      # Default configurations
```

### 4. serialization/mod.rs (261 lines) → `serialization/` module
```
src/utils/serialization/
├── mod.rs           # Public API & re-exports
├── formats.rs       # SerializationFormat enum & comparison
├── json.rs          # JSON serialization
├── messagepack.rs   # MessagePack serialization
└── cbor.rs          # CBOR serialization
```

### 5. main.rs (240 lines) → Split responsibilities
```
src/
├── main.rs          # Entry point only (~50 lines)
└── bootstrap.rs     # Initialization logic
```

### 6. sysinfo_handlers.rs (213 lines) → `sysinfo_handlers/` module
```
src/core/application/handlers/sysinfo_handlers/
├── mod.rs           # Public API
├── system_info.rs   # System information handlers
└── platform_info.rs # Platform-specific handlers
```

### 7. logging.rs (197 lines) → `logging/` module
```
src/core/infrastructure/logging/
├── mod.rs           # Public API
├── logger.rs        # Logger struct & implementation
├── formatter.rs     # Message formatting
└── config.rs        # Logging configuration
```

## Benefits

- ✅ Each file < 150 lines (average ~100)
- ✅ Clear separation of concerns
- ✅ Easier to test individual components
- ✅ Better code navigation
- ✅ Follows single responsibility principle
- ✅ Easier to maintain and extend
