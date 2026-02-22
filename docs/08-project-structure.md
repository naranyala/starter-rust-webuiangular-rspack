# Project Structure

## Repository Layout

```
starter-rust-webuiangular-rspack/
│
├── 📄 Configuration Files
│   ├── Cargo.toml                 # Rust package manifest
│   ├── Cargo.lock                 # Dependency lock file
│   ├── package.json               # Frontend dependencies
│   ├── bun.lock                   # Bun lock file
│   ├── angular.json               # Angular CLI config
│   ├── rspack.config.js           # Rspack bundler config
│   ├── biome.json                 # Biome linter config
│   ├── tsconfig.json              # TypeScript config
│   └── app.config.toml            # Application config
│
├── 📂 src/                        # Rust Backend
│   ├── main.rs                    # Entry point
│   ├── utils_demo.rs              # Utility demos
│   └── core/                      # Clean Architecture
│       ├── domain/                # Business entities
│       ├── application/           # Use cases
│       ├── infrastructure/        # External concerns
│       └── presentation/          # WebUI integration
│
├── 📂 frontend/                   # Angular Frontend
│   ├── src/
│   │   ├── main.ts                # Entry point
│   │   ├── views/                 # Components
│   │   ├── viewmodels/            # State management
│   │   ├── core/                  # Services
│   │   ├── models/                # Types
│   │   └── devtools/              # DevTools panel
│   ├── angular.json
│   ├── rspack.config.js
│   └── biome.json
│
├── 📂 docs/                       # Documentation
│   ├── 01-introduction.md
│   ├── 02-architecture.md
│   ├── 03-build-system.md
│   ├── 04-communication.md
│   ├── 05-dependencies.md
│   ├── 06-improvements.md
│   ├── 07-getting-started.md
│   ├── 08-project-structure.md
│   ├── 09-errors-as-values.md
│   └── REFACTORING_CONNECTION_POOLING.md
│
├── 📂 config/                     # Runtime Config
│   └── app.config.toml
│
├── 📂 static/                     # Static Assets (runtime)
│   ├── js/
│   └── css/
│
├── 📂 thirdparty/                 # Third-party
│   └── webui-c-src/               # WebUI C source
│
└── 📂 target/                     # Build output
    ├── debug/
    └── release/
```

---

## Backend Structure (Rust)

### src/

#### `main.rs` - Application Entry Point

**Purpose**: Bootstrap application, initialize DI container, create window

**Key Responsibilities**:
- Initialize error handling with panic hook
- Load configuration from TOML
- Initialize logging system
- Create DI container
- Initialize database with connection pooling
- Register WebUI event handlers
- Create and show window
- Enter event loop

**Code Flow**:
```rust
fn main() {
    // 1. Initialize error handling
    error_handler::init_error_handling();
    
    // 2. Initialize DI container
    di::init_container()?;
    
    // 3. Load configuration
    let config = AppConfig::load()?;
    
    // 4. Initialize logging
    logging::init_logging_with_config(...)?;
    
    // 5. Initialize database
    let db = Database::new(config.db_path)?;
    
    // 6. Register handlers
    setup_ui_handlers(&mut window);
    setup_db_handlers(&mut window);
    setup_error_handlers(&mut window);
    setup_devtools_handlers(&mut window);
    
    // 7. Show window
    window.show("index.html");
    
    // 8. Enter event loop
    webui::wait();
}
```

#### `utils_demo.rs` - Utility Demonstrations

**Purpose**: Showcase available utility modules

**Modules Demonstrated**:
- Compression (gzip, zstd, brotli, lz4, snap)
- Cryptography (SHA256, HMAC, MD5, base64, hex)
- Encoding (base64, punycode, ASCII85)
- File operations (read, write, copy, delete)
- Network (get local IP)
- Security (password hashing, email validation)
- Serialization (JSON, MessagePack, CBOR, YAML)
- System (hostname, CPU count, PID, admin check)
- Validation (email, URL)

#### `core/` - Clean Architecture Implementation

##### `domain/` - Business Entities

**Purpose**: Pure business logic with zero external dependencies

**Structure**:
```
domain/
├── entities/
│   └── mod.rs          # Entity definitions
├── traits/
│   └── mod.rs          # Domain interfaces
└── mod.rs              # Module exports
```

**Example Entity**:
```rust
// src/core/domain/entities/mod.rs
pub struct User {
    pub id: i64,
    pub name: String,
    pub email: String,
    pub role: Role,
    pub status: UserStatus,
    pub created_at: String,
}

pub enum Role {
    Admin,
    User,
    Guest,
}
```

##### `application/` - Use Cases

**Purpose**: Implement business use cases and handlers

**Structure**:
```
application/
├── handlers/
│   ├── mod.rs
│   ├── db_handlers.rs      # Database operations
│   ├── api_handlers.rs     # API endpoints
│   └── ui_handlers.rs      # UI interactions
└── mod.rs
```

**Responsibilities**:
- Orchestrate domain entities
- Validate input
- Handle application logic
- Return `Result<T, AppError>`

##### `infrastructure/` - External Concerns

**Structure**:
```
infrastructure/
├── database/
│   ├── mod.rs
│   ├── connection.rs    # r2d2 connection pool
│   ├── models.rs        # Database models
│   └── users.rs         # User repository
├── logging/
│   ├── mod.rs
│   ├── config.rs        # Logging config
│   ├── formatter.rs     # Log formatting
│   └── logger.rs        # Logger implementation
├── config.rs            # TOML configuration
├── di.rs                # Dependency injection
├── event_bus.rs         # Event bus implementation
└── error_handler.rs     # Enhanced error handling
```

**Key Components**:

1. **Database** (`database/connection.rs`):
   - r2d2 connection pool
   - Prepared statements
   - Transaction support
   - Pool statistics

2. **Logging** (`logging/`):
   - JSON file logging
   - Colored console output
   - Log rotation
   - Configurable levels

3. **Error Handler** (`error_handler.rs`):
   - Panic hook
   - Error tracking
   - Terminal output
   - Statistics

4. **DI Container** (`di.rs`):
   - Type-safe registration
   - Singleton support
   - Arc-based sharing

##### `presentation/` - WebUI Integration

**Structure**:
```
presentation/
├── webui/
│   ├── mod.rs
│   └── handlers/
│       ├── mod.rs
│       ├── db_handlers.rs         # Database handlers
│       ├── sysinfo_handlers.rs    # System info handlers
│       ├── logging_handlers.rs    # Log handlers
│       ├── event_bus_handlers.rs  # Event bus handlers
│       ├── window_state_handler.rs # Window management
│       ├── error_handlers.rs      # Error tracking
│       └── devtools_handlers.rs   # DevTools support
└── mod.rs
```

**Handler Pattern**:
```rust
pub fn setup_db_handlers(window: &mut webui::Window) {
    window.bind("get_users", |event| {
        let db = get_db().unwrap();
        let users = db.get_all_users().unwrap();
        
        let response = json!({
            "success": true,
            "data": users
        });
        
        dispatch_event(window, "db_response", &response);
    });
}
```

---

## Frontend Structure (Angular)

### frontend/

#### `src/` - Application Source

##### `main.ts` - Entry Point

**Purpose**: Bootstrap Angular application with error handling

**Key Code**:
```typescript
// Setup global error interception
setupGlobalErrorInterception();

// Bootstrap Angular
bootstrapApplication(AppComponent, {
  providers: [{ 
    provide: ErrorHandler, 
    useClass: GlobalErrorHandler 
  }],
})
.then(appRef => {
  // Setup global error listeners
  window.addEventListener('error', ...);
  window.addEventListener('unhandledrejection', ...);
})
.catch(err => {
  // Bootstrap failed
  document.body.innerHTML = `<h1>Error: ${err.message}</h1>`;
});
```

##### `views/` - Components (View Layer)

**Structure**:
```
views/
├── app.component.ts       # Root component
├── app.component.html
├── app.component.css
├── app.module.ts          # Root module (if needed)
├── app-routing.module.ts  # Routing config
│
├── home/
│   ├── home.component.ts
│   └── home.component.html
│
├── demo/
│   ├── demo.component.ts
│   └── error-handling-demo.component.ts
│
├── devtools/
│   └── devtools.component.ts    # DevTools panel
│
└── shared/
    ├── error-modal.component.ts
    └── ...
```

**Component Pattern**:
```typescript
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ErrorModalComponent, DevtoolsComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit, OnDestroy {
  // Inject services
  readonly globalErrorService = inject(GlobalErrorService);
  
  // Signals
  searchQuery = signal('');
  windowEntries = signal<WindowEntry[]>([]);
  
  // Computed
  filteredCards = computed(() => {
    const query = this.searchQuery().toLowerCase();
    return this.cards.filter(c => c.title.toLowerCase().includes(query));
  });
  
  ngOnInit(): void {
    // Initialize
  }
}
```

##### `viewmodels/` - State Management (ViewModel Layer)

**Structure**:
```
viewmodels/
├── event-bus.viewmodel.ts    # Pub/sub event bus
├── logging.viewmodel.ts      # Logging backend
├── logger.viewmodel.ts       # Logger facade
├── window-state.viewmodel.ts # Window management
├── api-client.viewmodel.ts   # Backend API client
└── error-dashboard.viewmodel.ts # Error tracking
```

**ViewModel Pattern**:
```typescript
@Injectable({ providedIn: 'root' })
export class WindowStateViewModel {
  private readonly windowEntries = signal<WindowEntry[]>([]);
  
  readonly minimizedCount = computed(() => 
    this.windowEntries().filter(e => e.minimized).length
  );
  
  readonly hasFocused = computed(() => 
    this.windowEntries().some(e => e.focused)
  );
  
  addWindow(entry: WindowEntry): void {
    this.windowEntries.update(entries => [...entries, entry]);
  }
  
  removeWindow(id: string): void {
    this.windowEntries.update(entries => 
      entries.filter(e => e.id !== id)
    );
  }
}
```

##### `core/` - Services (Infrastructure)

**Structure**:
```
core/
├── index.ts
├── global-error.handler.ts   # Angular ErrorHandler
├── global-error.service.ts   # Error state management
├── error-interceptor.ts      # Error interception
├── winbox.service.ts         # WinBox window service
│
├── plugins/
│   ├── plugin.interface.ts   # Plugin interface
│   └── plugin-registry.ts    # Plugin registry
│
└── base/
    ├── service.base.ts       # Base service class
    └── viewmodel.base.ts     # Base ViewModel class
```

**Error Handler Pattern**:
```typescript
export class GlobalErrorHandler implements ErrorHandler {
  private readonly injector = inject(Injector);
  
  handleError(error: unknown): void {
    const errorService = this.injector.get(GlobalErrorService);
    const errorValue = this.extractErrorValue(error);
    
    errorService.report(errorValue, {
      source: 'angular',
      title: this.extractTitle(error),
    });
  }
  
  private extractErrorValue(error: unknown): ErrorValue {
    // Convert to structured ErrorValue
  }
}
```

##### `models/` - Data Types (Model Layer)

**Structure**:
```
models/
├── index.ts
├── card.model.ts         # Card entity
├── window.model.ts       # Window state
├── log.model.ts          # Logging types
├── error.model.ts        # Error types
└── api.model.ts          # API types
```

**Model Pattern**:
```typescript
// error.model.ts
export interface ErrorValue {
  code: ErrorCode;
  message: string;
  details?: string;
  field?: string;
  cause?: string;
  context?: Record<string, string>;
}

export enum ErrorCode {
  DbConnectionFailed = 'DB_CONNECTION_FAILED',
  DbQueryFailed = 'DB_QUERY_FAILED',
  ValidationFailed = 'VALIDATION_FAILED',
  ResourceNotFound = 'RESOURCE_NOT_FOUND',
  InternalError = 'INTERNAL_ERROR',
  Unknown = 'UNKNOWN',
}
```

##### `types/` - TypeScript Definitions

**Structure**:
```
types/
├── index.ts
├── error.types.ts        # Error type definitions
├── error.types.test.ts   # Type tests
└── winbox.d.ts           # WinBox type declarations
```

##### `environments/` - Environment Configs

**Structure**:
```
environments/
├── environment.ts        # Development config
└── environment.prod.ts   # Production config
```

**Pattern**:
```typescript
export const environment = {
  production: false,
  logging: {
    level: 'debug',
    console: true,
    backend: true,
  },
};
```

---

## Configuration Files

### Cargo.toml (Rust)

```toml
[package]
name = "rustwebui-app"
version = "1.0.0"
edition = "2021"

[dependencies]
webui-rs = { git = "https://github.com/webui-dev/rust-webui" }
rusqlite = { version = "0.32", features = ["bundled"] }
r2d2 = "0.8"
r2d2_sqlite = "0.25"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
log = "0.4"
backtrace = "0.3"

[profile.release]
opt-level = 3
lto = true
```

### package.json (Frontend)

```json
{
  "name": "angular-rspack-demo",
  "scripts": {
    "dev": "bun run rspack serve",
    "build:rspack": "bun run rspack build",
    "lint": "biome check",
    "lint:fix": "biome check --write",
    "format": "biome format",
    "format:fix": "biome format --write"
  },
  "dependencies": {
    "@angular/core": "^21.1.5",
    "@angular/common": "^21.1.5",
    "rxjs": "~7.8.2",
    "zone.js": "~0.15.1"
  },
  "devDependencies": {
    "@rspack/core": "^1.7.6",
    "@biomejs/biome": "^2.4.4",
    "typescript": "~5.9.0"
  }
}
```

### app.config.toml

```toml
[app]
name = "Rust WebUI SQLite Demo"
version = "1.0.0"

[window]
title = "Rust WebUI Application"
width = 1280
height = 800

[database]
path = "app.db"
create_sample_data = true

[logging]
level = "info"
file = "logs/application.log"
append = true

[communication]
transport = "webview_ffi"
serialization = "json"
```

---

## Build Output Structure

### target/ (Rust)

```
target/
├── debug/
│   ├── app              # Debug executable
│   ├── app.d            # Debug info
│   └── deps/            # Dependencies
├── release/
│   └── app              # Optimized executable
└── build/               # Build cache
```

### frontend/dist/ (Angular)

```
dist/
├── browser/
│   ├── index.html       # Main HTML
│   ├── main.<hash>.js   # Bundled JS
│   └── styles.<hash>.css # Bundled CSS
└── static/
    ├── js/
    │   ├── main.js      # Copied main JS
    │   ├── winbox.min.js # WinBox library
    │   └── webui.js     # WebUI bridge
    └── css/
        └── winbox.min.css # WinBox styles
```

---

## Runtime Files

### Generated at Runtime

```
./
├── app.db                    # SQLite database
├── application.log           # Application log
├── logs/
│   └── application.log       # Log file (if configured)
└── static/
    ├── js/                   # Copied JS assets
    └── css/                  # Copied CSS assets
```

### .gitignore

Files excluded from version control:
- `target/` (Rust build output)
- `frontend/node_modules/` (NPM packages)
- `frontend/dist/` (Build output)
- `frontend/.angular/` (Angular cache)
- `*.log` (Log files)
- `app.db` (Database)
- `bun.lock` (Package lock)

---

## File Naming Conventions

### Rust
- **Modules**: `snake_case.rs` (e.g., `error_handler.rs`)
- **Structs**: `PascalCase` (e.g., `Database`)
- **Functions**: `snake_case` (e.g., `get_all_users`)
- **Traits**: `PascalCase` (e.g., `Repository`)

### TypeScript
- **Components**: `kebab-case.component.ts` (e.g., `error-modal.component.ts`)
- **Services**: `kebab-case.service.ts` (e.g., `winbox.service.ts`)
- **ViewModels**: `kebab-case.viewmodel.ts` (e.g., `event-bus.viewmodel.ts`)
- **Models**: `kebab-case.model.ts` (e.g., `window.model.ts`)
- **Types**: `kebab-case.types.ts` (e.g., `error.types.ts`)

---

## Related Documentation

- [Architecture](02-architecture.md) - Design patterns
- [Build System](03-build-system.md) - Build process
- [Getting Started](07-getting-started.md) - Setup guide
