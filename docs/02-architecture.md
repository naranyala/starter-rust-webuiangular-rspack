# Architecture

## System Overview

The application implements a **hybrid architecture** combining:
- **Clean Architecture** (Rust backend) for separation of concerns
- **MVVM Pattern** (Angular frontend) for reactive UI
- **Event-Driven Communication** for decoupled components

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (Angular)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Views   │  │ ViewModels│  │  Models  │  │  Core    │   │
│  │          │←→│          │←→│          │←→│ Services │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕ WebUI Bindings (JSON/FFI)
┌─────────────────────────────────────────────────────────────┐
│                      BACKEND (Rust)                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Presentation Layer (WebUI)              │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │              Application Layer (Handlers)            │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │                Domain Layer (Entities)               │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │           Infrastructure Layer (DB, Logging)         │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Backend Architecture (Rust)

### Layer Structure

```
src/core/
├── domain/           # Business entities (pure Rust structs)
├── application/      # Use cases and handlers
├── infrastructure/   # External concerns (DB, logging, config)
└── presentation/     # WebUI integration
```

### Domain Layer

**Purpose**: Encapsulate business logic and entities

**Location**: `src/core/domain/`

**Characteristics**:
- Zero dependencies on other layers
- Pure Rust structs and enums
- Business rules and validation
- Domain events

```rust
// Example: User entity
pub struct User {
    pub id: i64,
    pub email: String,
    pub role: Role,
    pub status: UserStatus,
    pub created_at: DateTime,
}

pub enum Role {
    Admin,
    User,
    Guest,
}

pub enum UserStatus {
    Active,
    Inactive,
    Suspended,
}
```

### Application Layer

**Purpose**: Implement use cases and orchestrate domain objects

**Location**: `src/core/application/`

**Characteristics**:
- Defines application boundaries
- Coordinates domain entities
- Handles input validation
- Returns `Result<T, AppError>`

```rust
// Example: Create User Handler
pub struct CreateUserHandler {
    user_repo: Arc<UserRepository>,
    event_bus: Arc<EventBus>,
}

impl CreateUserHandler {
    pub fn execute(&self, dto: CreateUserDto) -> AppResult<User> {
        // Validate
        if !dto.email.is_valid() {
            return Err(AppError::Validation(/* ... */));
        }
        
        // Check uniqueness
        if self.user_repo.exists(&dto.email)? {
            return Err(AppError::Database(/* ... */));
        }
        
        // Create user
        let user = User::new(dto.email, dto.role);
        let saved = self.user_repo.save(user)?;
        
        // Publish event
        self.event_bus.publish("user.created", &saved);
        
        Ok(saved)
    }
}
```

### Infrastructure Layer

**Purpose**: Handle external concerns (database, logging, configuration)

**Location**: `src/core/infrastructure/`

**Components**:

#### Database Module

```rust
// Connection pooling with r2d2
pub struct Database {
    pool: Pool<SqliteConnectionManager>,
    config: DbPoolConfig,
}

impl Database {
    pub fn new(db_path: &str) -> AppResult<Self> {
        let manager = SqliteConnectionManager::file(db_path);
        let pool = Pool::builder()
            .max_size(10)
            .min_idle(Some(2))
            .build(manager)?;
        Ok(Self { pool, config: DbPoolConfig::default() })
    }
    
    pub fn get_conn(&self) -> AppResult<PooledConnection> {
        self.pool.get().map_err(/* ... */)
    }
}
```

**Features**:
- Connection pooling (no mutex bottlenecks)
- Automatic connection recycling
- Pool statistics monitoring
- Transaction support

#### Logging Module

```rust
// Multi-sink logging
pub struct Logger {
    file_path: Mutex<PathBuf>,
    log_to_console: bool,
    formatter: LogFormatter,
}

impl log::Log for Logger {
    fn log(&self, record: &Record) {
        // Format as JSON
        let json_msg = self.formatter.format_json(record);
        
        // Write to console
        if self.log_to_console {
            println!("{}", self.formatter.format_console(record));
        }
        
        // Write to file
        self.write_to_file(&json_msg);
    }
}
```

**Features**:
- JSON file logging
- Colored console output
- Log rotation
- Configurable log levels

#### Error Handler Module

```rust
// Enhanced error tracking
pub struct ErrorTracker {
    errors: Mutex<VecDeque<ErrorEntry>>,
    sequence: Mutex<u64>,
}

impl ErrorTracker {
    pub fn record(&self, entry: ErrorEntry) {
        // Store in history
        // Output to terminal with colors
        // Update statistics
    }
}

// Panic hook integration
pub fn init_error_handling() {
    std::panic::set_hook(Box::new(|panic_info| {
        // Extract panic info
        // Record as critical error
        // Print stack trace
    }));
}
```

**Features**:
- Panic hook with stack traces
- Error history (last 100 errors)
- Color-coded terminal output
- Error statistics

#### Dependency Injection

```rust
// Simple DI container
pub struct Container {
    services: Mutex<HashMap<TypeId, Arc<dyn Any + Send + Sync>>>,
}

impl Container {
    pub fn register<T>(&self, instance: T) -> AppResult<()> {
        // Type-safe registration
    }
    
    pub fn resolve<T>(&self) -> AppResult<T> {
        // Type-safe resolution
    }
}
```

### Presentation Layer

**Purpose**: Handle WebUI integration and event dispatching

**Location**: `src/core/presentation/webui/`

**Structure**:
```rust
// Handler registration
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

**Handler Types**:
- `db_handlers.rs` - Database operations
- `sysinfo_handlers.rs` - System information
- `logging_handlers.rs` - Log retrieval
- `event_bus_handlers.rs` - Event bus operations
- `window_state_handler.rs` - Window management
- `error_handlers.rs` - Error tracking
- `devtools_handlers.rs` - DevTools support

---

## Frontend Architecture (Angular)

### MVVM Pattern Structure

```
frontend/src/
├── views/           # Components (View layer)
├── viewmodels/      # State + Logic (ViewModel layer)
├── models/          # Types (Model layer)
└── core/            # Services (Infrastructure)
```

### Models Layer

**Purpose**: Define data structures and type contracts

**Location**: `src/models/`

```typescript
// Example: User model
export interface User {
  id: number;
  name: string;
  email: string;
  role: 'Admin' | 'User' | 'Guest';
  status: 'Active' | 'Inactive';
  created_at: string;
}

// Error types
export interface ErrorValue {
  code: ErrorCode;
  message: string;
  details?: string;
  field?: string;
  context?: Record<string, string>;
}

export enum ErrorCode {
  DbConnectionFailed = 'DB_CONNECTION_FAILED',
  ValidationFailed = 'VALIDATION_FAILED',
  ResourceNotFound = 'RESOURCE_NOT_FOUND',
  InternalError = 'INTERNAL_ERROR',
}
```

### ViewModels Layer

**Purpose**: Business logic and state management

**Location**: `src/viewmodels/`

#### Event Bus ViewModel

```typescript
@Injectable({ providedIn: 'root' })
export class EventBusViewModel<Events extends object> {
  private subscriptions = new Map<keyof Events, Map<number, Handler>>();
  private history: BusEvent[] = [];
  
  subscribe<K extends keyof Events>(
    name: K,
    handler: Handler<Events[K]>,
    options?: SubscribeOptions
  ): () => void {
    // Register subscription
    // Return unsubscribe function
  }
  
  publish<K extends keyof Events>(
    name: K,
    payload: Events[K],
    options?: PublishOptions
  ): void {
    // Create event
    // Add to history
    // Dispatch to subscribers
  }
  
  stats(): EventBusStats {
    return {
      listeners: this.countListeners(),
      historySize: this.history.length,
    };
  }
}
```

#### Logging ViewModel

```typescript
export class Logger {
  constructor(
    private backend: LoggingViewModel,
    private namespace: string
  ) {}
  
  info(message: string, context: LogContext = {}): void {
    this.log('info', message, context);
  }
  
  error(message: string, context: LogContext, error?: unknown): void {
    this.log('error', message, context, error);
  }
  
  private log(level: LogLevel, message: string, context: LogContext): void {
    // Format entry
    // Emit to backend
    // Console output
  }
}
```

#### Error Dashboard ViewModel

```typescript
@Injectable({ providedIn: 'root' })
export class ErrorDashboardViewModel {
  private readonly state = signal<ErrorDashboardState>({
    stats: { total: 0, errors: 0, warnings: 0, critical: 0 },
    recentErrors: [],
    isLoading: false,
  });
  
  readonly stats = computed(() => this.state().stats);
  readonly recentErrors = computed(() => this.state().recentErrors);
  
  requestStats(): void {
    window.get_error_stats('error_stats');
  }
  
  clearErrorHistory(): void {
    window.clear_error_history('clear_error_history');
  }
}
```

### Views Layer

**Purpose**: UI presentation and user interaction

**Location**: `src/views/`

#### Root Component

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
  private readonly winboxService = inject(WinBoxService);
  private readonly logger = getLogger('app.component');
  
  // Signals
  searchQuery = signal('');
  windowEntries = signal<WindowEntry[]>([]);
  bottomCollapsed = signal(true);
  
  // Computed signals
  filteredCards = computed(() => {
    const query = this.searchQuery().toLowerCase();
    return this.cards.filter(card => 
      card.title.toLowerCase().includes(query)
    );
  });
  
  ngOnInit(): void {
    // Initialize components
  }
}
```

#### DevTools Component

```typescript
@Component({
  selector: 'app-devtools',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="devtools">
      <!-- 5 Tabs: Backend, Frontend, Events, Environment, Actions -->
    </div>
  `,
  styles: [`/* Dark theme styles */`],
})
export class DevtoolsComponent implements OnInit, OnDestroy {
  activeTab = signal<'backend' | 'frontend' | 'events' | 'environment' | 'actions'>('backend');
  
  backendStats = signal<BackendStats>({ /* ... */ });
  frontendStats = signal<FrontendStats>({ /* ... */ });
  
  refreshAll(): void {
    this.refreshBackendStats();
    this.refreshFrontendStats();
  }
}
```

### Core Services Layer

**Purpose**: Shared infrastructure and base classes

**Location**: `src/core/`

#### Global Error Handler

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
}
```

#### Error Interceptor

```typescript
export class ErrorInterceptor {
  private stats: ErrorStats = { total: 0, bySource: new Map() };
  
  interceptWebUICall<T>(
    operation: string,
    fn: () => T
  ): T | null {
    try {
      return fn();
    } catch (error) {
      this.handleError(error, { source: 'webui', operation });
      return null;
    }
  }
  
  handleError(error: unknown, context: ErrorContext): void {
    // Update statistics
    // Log to console with colors
    // Report to error service
  }
}
```

---

## Communication Architecture

### WebUI Bindings

**Flow**: Frontend → Backend

```javascript
// Frontend: Call backend function
window.get_users();

// Backend: Handler receives event
window.bind("get_users", |event| {
    let users = db.get_all_users()?;
    send_response(window, "db_response", &users);
});

// Frontend: Listen for response
window.addEventListener('db_response', (event) => {
    const users = event.detail.data;
    // Update UI
});
```

### Event Bus

**Flow**: Component → Event Bus → Subscribers

```typescript
// Publish event
eventBus.publish('user:created', { id: 123, name: 'Alice' });

// Subscribe to event
const unsubscribe = eventBus.subscribe('user:created', (payload) => {
    console.log('User created:', payload);
});

// Unsubscribe when done
unsubscribe();
```

### Error Propagation

```
User Action
    ↓
Component Method
    ↓
ViewModel Call
    ↓
Error Interceptor ← Records statistics
    ↓
Backend Handler
    ↓
Error Handler ← Records to tracker
    ↓
Terminal Output ← Color-coded error message
    ↓
Frontend Event ← Dispatched via WebUI
    ↓
Error Service ← Updates signals
    ↓
Error Modal ← Displays to user
```

---

## Data Flow Examples

### Example 1: Create User

```
┌─────────┐     ┌──────────┐     ┌─────────┐     ┌─────────┐
│  View   │     │ ViewModel│     │ Backend │     │  Database│
└────┬────┘     └────┬─────┘     └────┬────┘     └────┬────┘
     │               │                │               │
     │ create_user() │                │               │
     │──────────────>│                │               │
     │               │                │               │
     │               │ window.create_user()            │
     │               │───────────────>│               │
     │               │                │               │
     │               │                │ INSERT INTO   │
     │               │                │──────────────>│
     │               │                │               │
     │               │                │ Result<User>  │
     │               │                │<──────────────│
     │               │                │               │
     │               │ dispatch_event('user_created') │
     │               │<───────────────│               │
     │               │                │               │
     │ update UI     │                │               │
     │<──────────────│                │               │
     │               │                │               │
```

### Example 2: Error Handling

```
┌─────────┐     ┌──────────┐     ┌─────────┐     ┌──────────┐
│  View   │     │Interceptor│     │ Backend │     │ Terminal │
└────┬────┘     └────┬─────┘     └────┬────┘     └────┬─────┘
     │               │                │               │
     │ Action        │                │               │
     │──────────────>│                │               │
     │               │                │               │
     │               │ try { fn() }   │               │
     │               │ catch (error)  │               │
     │               │                │               │
     │               │ handleError()  │               │
     │               │───────────────>│               │
     │               │                │               │
     │               │                │ record_error()│
     │               │                │──────────────>│
     │               │                │               │
     │               │                │ [ERROR #1]    │
     │               │                │ DB_QUERY_FAILED│
     │               │                │ Message: ...  │
     │               │                │               │
     │               │ console.error()│               │
     │               │<───────────────│               │
     │               │ [RED] Error   │               │
     │               │               │               │
```

---

## Security Considerations

### Input Validation

**Backend**:
```rust
// Validate all inputs
if !dto.email.contains('@') {
    return Err(AppError::Validation(
        ErrorValue::new(ErrorCode::ValidationFailed, "Invalid email")
            .with_field("email")
    ));
}
```

**Frontend**:
```typescript
// Client-side validation
if (!email.includes('@')) {
    errorService.report({
        code: ErrorCode.ValidationFailed,
        message: 'Invalid email',
        field: 'email'
    });
    return;
}
```

### SQL Injection Prevention

```rust
// Use parameterized queries
conn.execute(
    "INSERT INTO users (name, email) VALUES (?, ?)",
    params![name, email]  // ← Parameters, not string concatenation
)?;
```

### XSS Prevention

```typescript
// Angular auto-escapes by default
// Use DomSanitizer for trusted HTML
constructor(private sanitizer: DomSanitizer) {}

getTrustedHtml(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
}
```

---

## Performance Optimizations

### Backend

1. **Connection Pooling**: r2d2 pool prevents mutex contention
2. **Prepared Statements**: SQL statements cached and reused
3. **Log Buffering**: Batch file writes for I/O efficiency
4. **Error Tracking**: Circular buffer (last 100 errors only)

### Frontend

1. **Signals**: Fine-grained reactivity (no zone.js overhead for signals)
2. **Lazy Loading**: Routes loaded on demand
3. **Tree Shaking**: Rspack removes unused code
4. **Event Debouncing**: Search input debounced

---

## Testing Strategy

### Backend Tests

```rust
#[test]
fn test_database_init() {
    let db = Database::new(":memory:").expect("Failed to create DB");
    assert!(db.init().is_ok());
}

#[test]
fn test_insert_and_get_user() {
    let db = create_test_db();
    
    let user_id = db.insert_user("Test", "test@example.com", "User", "Active")
        .expect("Failed to insert");
    
    let user = db.get_user_by_id(user_id)
        .expect("Failed to get")
        .expect("User not found");
    
    assert_eq!(user.name, "Test");
}
```

### Frontend Tests

```typescript
describe('ErrorInterceptor', () => {
  it('should capture errors', () => {
    const interceptor = new ErrorInterceptor();
    
    interceptor.interceptWebUICall('test', () => {
      throw new Error('Test error');
    });
    
    const stats = interceptor.getStats();
    expect(stats.total).toBe(1);
  });
});
```

---

## Related Documentation

- [Project Structure](08-project-structure.md) - File organization
- [Communication](04-communication.md) - IPC patterns
- [Error Handling](../ERROR_HANDLING_GUIDE.md) - Error patterns
- [Connection Pooling](REFACTORING_CONNECTION_POOLING.md) - Database optimization
