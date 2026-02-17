# Errors as Values - Implementation Plan

## Philosophy

Instead of throwing exceptions, we return errors as values that must be explicitly handled. This makes error flows:
- **Explicit** - Errors are visible in types
- **Composable** - Errors can be transformed and combined
- **Testable** - Errors are regular values
- **Traceable** - Error context is preserved

## Backend (Rust) Implementation

### Core Error Types

```rust
// Result<T, E> - Standard Rust pattern
type Result<T> = std::result::Result<T, AppError>;

// AppError - Application error hierarchy
pub enum AppError {
    Domain(DomainError),
    Infrastructure(InfrastructureError),
    Application(ApplicationError),
    Plugin(PluginError),
}
```

### Error Hierarchy

```
AppError
├── DomainError
│   ├── Validation(String)
│   ├── NotFound(String)
│   ├── Conflict(String)
│   └── BusinessRule(String)
├── InfrastructureError
│   ├── Database(DbError)
│   ├── FileSystem(IoError)
│   ├── Network(HttpError)
│   └── Serialization(SerializeError)
├── ApplicationError
│   ├── InvalidState(String)
│   ├── Timeout(String)
│   └── Canceled(String)
└── PluginError
    ├── NotFound(String)
    ├── LoadFailed(String)
    └── InitFailed(String)
```

### Error Wrapper with Context

```rust
pub struct Error {
    pub kind: ErrorKind,
    pub message: String,
    pub source: Option<Box<dyn std::error::Error + Send + Sync>>,
    pub context: HashMap<String, String>,
    pub backtrace: Option<Backtrace>,
}
```

### Result Extensions

```rust
pub trait ResultExt<T, E> {
    fn context<C>(self, context: C) -> Result<T, Error>;
    fn with_context<C, F>(self, f: F) -> Result<T, Error>;
    fn map_err_context<F, C>(self, f: F) -> Result<T, Error>;
}
```

## Frontend (TypeScript) Implementation

### Result Type

```typescript
type Result<T, E = AppError> = Ok<T, E> | Err<T, E>;

class Ok<T, E> {
  readonly isSuccess = true;
  constructor(readonly value: T) {}
}

class Err<T, E> {
  readonly isSuccess = false;
  constructor(readonly error: E) {}
}
```

### Error Hierarchy

```typescript
abstract class AppError {
  abstract readonly name: string;
  abstract readonly code: string;
  readonly message: string;
  readonly cause?: Error;
  readonly context: Record<string, any>;
  readonly timestamp: number;
}

class DomainError extends AppError {
  readonly name = 'DomainError';
}

class ValidationError extends DomainError {
  readonly code = 'VALIDATION_ERROR';
}

class InfrastructureError extends AppError {
  readonly name = 'InfrastructureError';
}
```

### Result Utilities

```typescript
const Result = {
  ok: <T>(value: T) => new Ok(value),
  err: <E>(error: E) => new Err(error),
  try: <T>(fn: () => T): Result<T, Error> => {
    try { return Result.ok(fn()); }
    catch (e) { return Result.err(e as Error); }
  },
  async tryAsync: <T>(fn: () => Promise<T>): Promise<Result<T, Error>> => {
    try { return Result.ok(await fn()); }
    catch (e) { return Result.err(e as Error); }
  }
};
```

## Implementation Files

### Backend
- `core/backend/src/error/mod.rs` - Error module root
- `core/backend/src/error/kinds.rs` - Error kinds
- `core/backend/src/error/error.rs` - Error struct
- `core/backend/src/error/result_ext.rs` - Result extensions
- `core/backend/src/error/handler.rs` - Error handler

### Frontend
- `core/frontend/src/error/index.ts` - Error module root
- `core/frontend/src/error/result.ts` - Result type
- `core/frontend/src/error/errors.ts` - Error classes
- `core/frontend/src/error/handler.ts` - Error handler
