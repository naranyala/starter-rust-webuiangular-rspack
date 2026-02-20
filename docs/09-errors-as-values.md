# Errors as Values - Implementation Guide

This document describes the "Errors as Values" pattern implemented in this project, covering both the Rust backend and TypeScript frontend.

## Table of Contents

1. [Overview](#overview)
2. [Core Concepts](#core-concepts)
3. [Backend Implementation (Rust)](#backend-implementation-rust)
4. [Frontend Implementation (TypeScript)](#frontend-implementation-typescript)
5. [Cross-Boundary Communication](#cross-boundary-communication)
6. [Usage Examples](#usage-examples)
7. [Best Practices](#best-practices)

---

## Overview

**Errors as Values** is a functional programming pattern where errors are treated as regular data values rather than exceptional control flow. This approach provides:

- **Type Safety**: Errors are part of function signatures via `Result<T, E>`
- **Explicit Handling**: Callers must explicitly handle success and failure cases
- **Composability**: Errors can be transformed, mapped, and chained like any other value
- **Cross-Boundary Consistency**: Same error structure on both backend and frontend

### Key Benefits

1. **No Hidden Exceptions**: All error cases are visible in type signatures
2. **Better Error Messages**: Structured errors carry codes, context, and causes
3. **Easier Testing**: Errors are values you can assert on
4. **Graceful Degradation**: Errors flow through the system and can be handled at appropriate levels

---

## Core Concepts

### The Result Type

The foundation of errors-as-values is the `Result` type:

```rust
// Rust
pub type AppResult<T> = Result<T, AppError>;
```

```typescript
// TypeScript
type Result<T, E = ErrorValue> = 
  | { ok: true; value: T }
  | { ok: false; error: E };
```

### Structured Error Values

Errors carry metadata for programmatic handling:

```rust
// Rust ErrorValue
pub struct ErrorValue {
    pub code: ErrorCode,
    pub message: String,
    pub details: Option<String>,
    pub field: Option<String>,
    pub cause: Option<String>,
    pub context: Option<HashMap<String, String>>,
}
```

```typescript
// TypeScript ErrorValue
export interface ErrorValue {
  code: ErrorCode;
  message: string;
  details?: string;
  field?: string;
  cause?: string;
  context?: Record<string, string>;
}
```

### Error Codes

Machine-readable codes enable programmatic error handling:

```rust
// Rust
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ErrorCode {
    DbConnectionFailed = 1000,
    DbQueryFailed = 1001,
    ValidationFailed = 4000,
    ResourceNotFound = 5000,
    InternalError = 6999,
}
```

```typescript
// TypeScript
export enum ErrorCode {
  DbConnectionFailed = 'DB_CONNECTION_FAILED',
  DbQueryFailed = 'DB_QUERY_FAILED',
  ValidationFailed = 'VALIDATION_FAILED',
  ResourceNotFound = 'RESOURCE_NOT_FOUND',
  InternalError = 'INTERNAL_ERROR',
}
```

---

## Backend Implementation (Rust)

### File Structure

```
src/core/
├── error.rs                    # Core error types and utilities
└── infrastructure/
    └── database/
        └── users.rs            # Example database operations with errors
```

### Creating Errors

```rust
use crate::core::error::{AppError, ErrorValue, ErrorCode, AppResult};

// Simple error creation
fn simple_error() -> AppResult<()> {
    Err(AppError::Validation(
        ErrorValue::new(ErrorCode::ValidationFailed, "Invalid input")
    ))
}

// Error with context
fn contextual_error(user_id: i64) -> AppResult<()> {
    Err(AppError::NotFound(
        ErrorValue::new(ErrorCode::UserNotFound, "User not found")
            .with_field("id")
            .with_context("user_id", user_id.to_string())
            .with_cause("Database query returned no results")
    ))
}

// Error from helper functions
use crate::core::error::errors;

fn helper_error() -> AppResult<()> {
    Err(errors::db_not_found("User", 123))
}
```

### Converting Errors

```rust
// From trait implementations
impl From<rusqlite::Error> for AppError {
    fn from(err: rusqlite::Error) -> Self {
        let error_value = ErrorValue::new(ErrorCode::DbQueryFailed, err.to_string())
            .with_cause("SQLite operation failed");
        AppError::Database(error_value)
    }
}

// Usage with ? operator
fn database_operation(db: &Database) -> AppResult<Vec<User>> {
    // rusqlite::Error automatically converts to AppError
    let users = db.get_all_users()?;
    Ok(users)
}
```

### Handling Results

```rust
// Pattern matching
match operation() {
    Ok(value) => println!("Success: {:?}", value),
    Err(AppError::Validation(e)) => println!("Validation: {}", e.message),
    Err(AppError::NotFound(e)) => println!("Not found: {}", e.message),
    Err(e) => println!("Other error: {}", e),
}

// Using combinators
let result: AppResult<User> = find_user(id)
    .map_err(|e| {
        // Transform error
        AppError::Logging(e.to_value().with_context("operation", "find_user"))
    });

// Early return with ?
fn process_user(id: i64) -> AppResult<UserResponse> {
    let user = find_user(id)?;  // Returns early if Err
    let validated = validate_user(&user)?;  // Returns early if Err
    Ok(UserResponse::from(validated))
}
```

### Database Operations Example

```rust
// src/core/infrastructure/database/users.rs

impl Database {
    pub fn insert_user(
        &self,
        name: &str,
        email: &str,
        role: &str,
        status: &str,
    ) -> DbResult<i64> {
        // Validate required fields
        if name.is_empty() {
            return Err(AppError::Validation(
                ErrorValue::new(ErrorCode::MissingRequiredField, "Name is required")
                    .with_field("name")
            ));
        }
        
        // Basic email validation
        if !email.contains('@') {
            return Err(AppError::Validation(
                ErrorValue::new(ErrorCode::InvalidFieldValue, "Email must be valid")
                    .with_field("email")
            ));
        }

        // Database operation with error conversion
        let conn = self.conn.lock().map_err(|_| {
            AppError::LockPoisoned(
                ErrorValue::new(ErrorCode::LockPoisoned, "Failed to acquire lock")
            )
        })?;
        
        conn.execute(/* ... */).map_err(|e| {
            // Check for specific error types
            if e.to_string().contains("UNIQUE constraint failed") {
                AppError::Database(
                    ErrorValue::new(ErrorCode::DbAlreadyExists, "Email already exists")
                        .with_field("email")
                )
            } else {
                AppError::Database(
                    ErrorValue::new(ErrorCode::DbQueryFailed, "Insert failed")
                        .with_cause(e.to_string())
                )
            }
        })?;

        Ok(conn.last_insert_rowid())
    }
}
```

---

## Frontend Implementation (TypeScript)

### File Structure

```
frontend/src/
├── types/
│   └── error.types.ts          # Core error types and utilities
├── core/
│   └── global-error.service.ts # Error handling service
├── viewmodels/
│   └── api-client.ts           # Backend API client
└── views/
    └── demo/
        └── error-handling-demo.component.ts
```

### Creating Errors

```typescript
import { ErrorValue, ErrorCode, ok, err, Result } from '../types/error.types';

// Create error value
const error: ErrorValue = {
  code: ErrorCode.ValidationFailed,
  message: 'Invalid email format',
  field: 'email',
};

// Create Result
const success: Result<User> = ok(user);
const failure: Result<User> = err(error);
```

### Type Guards

```typescript
import { isOk, isErr, isSuccess, isError } from '../types/error.types';

// Result type guards
const result = await getUsers();

if (isOk(result)) {
  // TypeScript knows result.value exists
  console.log(result.value);
} else {
  // TypeScript knows result.error exists
  console.error(result.error.message);
}

// API Response type guards
const response = await fetch('/api/users');

if (isSuccess(response)) {
  console.log(response.data);
} else {
  console.error(response.error);
}
```

### Result Combinators

```typescript
import { mapResult, mapError, andThen, unwrapOr } from '../types/error.types';

// Map success value
const users = await getUsers();
const activeUsers = mapResult(users, u => u.filter(user => user.status === 'Active'));

// Map error value
const mapped = mapError(users, err => ({
  ...err,
  message: `User operation failed: ${err.message}`
}));

// Chain operations (flat map)
const result = andThen(getUser(id), user => 
  user.isActive 
    ? ok(user) 
    : err({ code: ErrorCode.ValidationFailed, message: 'User is inactive' })
);

// Provide default
const usersOrDefault = unwrapOr(users, []);
```

### Global Error Service

```typescript
import { GlobalErrorService } from './core/global-error.service';

// Inject in component
constructor(private errorService: GlobalErrorService) {}

// Report error
this.errorService.report(errorValue, {
  source: 'user-list',
  title: 'Failed to load users'
});

// Handle Result
const users = this.errorService.handleResult(
  await getUsers(),
  { source: 'user-list', title: 'Failed to load' }
);

if (users) {
  // Success path
} else {
  // Error already displayed to user
}

// Create specific errors
this.errorService.validationError('email', 'Invalid email format');
this.errorService.notFoundError('User', 123);

// Convert exceptions
try {
  riskyOperation();
} catch (ex) {
  const error = this.errorService.fromException(ex, ErrorCode.InternalError);
  this.errorService.report(error);
}
```

### API Client

```typescript
import { getUsers, createUser, isOk } from '../viewmodels/api-client';

// Call backend with automatic error handling
async loadUsers() {
  const result = await getUsers();
  
  if (isOk(result)) {
    this.users = result.value;
  } else {
    this.errorMessage = result.error.message;
  }
}

async createUser() {
  const result = await createUser({
    name: 'John',
    email: 'john@example.com'
  });
  
  if (isOk(result)) {
    this.userId = result.value;
  } else {
    // Error is a value, not an exception
    this.handleError(result.error);
  }
}
```

---

## Cross-Boundary Communication

### Backend → Frontend Protocol

Backend handlers send structured responses:

```rust
// Success response
fn send_success_response(window: webui::Window, event_name: &str, data: &Value) {
    let response = json!({
        "success": true,
        "data": data,
        "error": null
    });
    dispatch_event(window, event_name, &response);
}

// Error response
fn send_error_response(window: webui::Window, event_name: &str, err: &AppError) {
    let error_value = err.to_value();
    let response = json!({
        "success": false,
        "data": null,
        "error": error_value.to_response()  // Serializable ErrorValue
    });
    dispatch_event(window, event_name, &response);
}
```

### Frontend Response Handling

```typescript
// API response type
export type ApiResponse<T> = 
  | { success: true; data: T; error: null }
  | { success: false; data: null; error: ErrorValue };

// Type guards
export function isSuccess<T>(response: ApiResponse<T>): response is SuccessResponse<T> {
  return response.success === true;
}

export function isError<T>(response: ApiResponse<T>): response is ErrorResponse {
  return response.success === false;
}

// Convert to Result
export function toResult<T>(response: ApiResponse<T>): Result<T, ErrorValue> {
  if (isSuccess(response)) {
    return ok(response.data);
  }
  return err(response.error);
}
```

---

## Usage Examples

### Example 1: Loading Data

```typescript
// Component
async loadUsers() {
  this.loading = true;
  
  const result = await getUsers();
  
  if (isOk(result)) {
    this.users = result.value;
    this.logger.info('Users loaded', { count: this.users.length });
  } else {
    // Error as a value - handle it explicitly
    this.errorService.report(result.error, {
      source: 'user-list',
      title: 'Failed to load users'
    });
  }
  
  this.loading = false;
}
```

### Example 2: Form Submission

```typescript
async submitForm() {
  // Client-side validation first
  if (!this.isValid()) {
    this.errorService.validationError('form', 'Please fix validation errors');
    return;
  }
  
  this.submitting = true;
  
  const result = await createUser(this.formData);
  
  if (isOk(result)) {
    this.logger.info('User created', { id: result.value });
    this.form.reset();
    this.loadUsers(); // Refresh list
  } else {
    // Handle specific error codes
    switch (result.error.code) {
      case ErrorCode.DbAlreadyExists:
        this.errorService.validationError(
          'email', 
          'A user with this email already exists'
        );
        break;
      default:
        this.errorService.handleResult(result, {
          source: 'create-user',
          title: 'Failed to create user'
        });
    }
  }
  
  this.submitting = false;
}
```

### Example 3: Chaining Operations

```typescript
async processUserWorkflow(userId: number) {
  // Chain multiple operations
  const userResult = await getUser(userId);
  if (isErr(userResult)) {
    this.errorService.report(userResult.error);
    return;
  }
  
  const validatedResult = this.validateUser(userResult.value);
  if (isErr(validatedResult)) {
    this.errorService.report(validatedResult.error);
    return;
  }
  
  const updateResult = await updateUser({
    id: userId,
    ...validatedResult.value
  });
  
  if (isOk(updateResult)) {
    this.logger.info('User updated successfully');
  } else {
    this.errorService.report(updateResult.error);
  }
}
```

### Example 4: Rust Backend Handler

```rust
pub fn setup_db_handlers(window: &mut webui::Window) {
    window.bind("get_users", |event| {
        let window = event.get_window();
        
        let Some(db) = get_db() else {
            let err = AppError::DependencyInjection(
                ErrorValue::new(ErrorCode::InternalError, "Database not initialized")
            );
            send_error_response(window, "db_response", &err);
            return;
        };
        
        // Handle result and send appropriate response
        match db.get_all_users() {
            Ok(users) => {
                send_success_response(window, "db_response", &json!({
                    "message": "Users retrieved successfully",
                    "payload": users
                }));
            }
            Err(e) => {
                // Error is logged and sent to frontend as structured value
                send_error_response(window, "db_response", &e);
            }
        }
    });
}
```

---

## Best Practices

### 1. Be Explicit About Errors

```rust
// ❌ Bad: Swallowing errors
fn get_user(id: i64) -> Option<User> {
    db.query(id).ok()  // Hides what went wrong
}

// ✅ Good: Explicit error types
fn get_user(id: i64) -> AppResult<User> {
    db.query(id).map_err(|e| {
        AppError::Database(
            ErrorValue::new(ErrorCode::DbQueryFailed, "Failed to get user")
                .with_context("user_id", id.to_string())
        )
    })
}
```

### 2. Provide Context

```rust
// ❌ Bad: Bare error
Err(AppError::Database(ErrorValue::new(
    ErrorCode::DbQueryFailed, 
    "Query failed"
)))

// ✅ Good: Contextualized error
Err(AppError::Database(ErrorValue::new(
    ErrorCode::DbQueryFailed, 
    "Failed to get user by email"
)
    .with_field("email")
    .with_context("email", email)
    .with_context("operation", "get_user_by_email")
    .with_cause(e.to_string())
))
```

### 3. Handle Errors at Appropriate Levels

```typescript
// ❌ Bad: Handling too early
async loadUsers() {
  const result = await getUsers();
  if (isErr(result)) {
    console.error(result.error);  // Just logging, not handling
    return;
  }
  // ...
}

// ✅ Good: Handle where it matters
async loadUsers() {
  const result = await getUsers();
  
  // Let error service handle display
  const users = this.errorService.handleResult(result, {
    source: 'user-list'
  });
  
  if (!users) {
    // Graceful degradation
    this.users = [];
    return;
  }
  
  this.users = users;
}
```

### 4. Use Error Codes for Programmatic Handling

```typescript
// ❌ Bad: String matching
if (result.error.message.includes('not found')) {
  // ...
}

// ✅ Good: Code-based handling
switch (result.error.code) {
  case ErrorCode.ResourceNotFound:
    this.showNotFoundPage();
    break;
  case ErrorCode.ValidationFailed:
    this.showValidationError(result.error.field);
    break;
  default:
    this.errorService.report(result.error);
}
```

### 5. Transform Errors for Different Contexts

```rust
// Domain layer returns domain-specific errors
fn get_user(&self, id: i64) -> DomainResult<User> {
    // ...
}

// Application layer transforms to application errors
fn handle_get_user(&self, id: i64) -> AppResult<UserResponse> {
    let user = self.get_user(id)
        .map_err(|e| match e {
            DomainError::NotFound => errors::not_found("User", id),
            DomainError::Invalid => errors::validation_failed("id", "Invalid user ID"),
        })?;
    
    Ok(UserResponse::from(user))
}
```

### 6. Test Error Paths

```rust
#[test]
fn test_insert_user_validation_empty_name() {
    let db = Database::new(":memory:").unwrap();
    db.init().unwrap();

    let result = db.insert_user("", "test@example.com", "User", "Active");
    
    assert!(result.is_err());
    if let Err(AppError::Validation(e)) = result {
        assert_eq!(e.field, Some("name".to_string()));
        assert_eq!(e.code, ErrorCode::MissingRequiredField);
    } else {
        panic!("Expected Validation error");
    }
}
```

```typescript
it('should handle duplicate email error', async () => {
  const result = await createUser({ name: 'Test', email: 'existing@example.com' });
  
  expect(isErr(result)).toBe(true);
  if (isErr(result)) {
    expect(result.error.code).toBe(ErrorCode.DbAlreadyExists);
    expect(result.error.field).toBe('email');
  }
});
```

---

## Migration Guide

### From Exceptions to Results

If you have existing code that throws exceptions:

```rust
// Before: Exception-based
fn get_user(id: i64) -> User {
    if id <= 0 {
        panic!("Invalid ID");
    }
    // ...
}

// After: Result-based
fn get_user(id: i64) -> AppResult<User> {
    if id <= 0 {
        return Err(errors::validation_failed("id", "ID must be positive"));
    }
    // ...
}
```

```typescript
// Before: Exception-based
async getUser(id: number): Promise<User> {
  if (id <= 0) {
    throw new Error('Invalid ID');
  }
  // ...
}

// After: Result-based
async getUser(id: number): Promise<Result<User>> {
  if (id <= 0) {
    return err({
      code: ErrorCode.ValidationFailed,
      message: 'ID must be positive',
      field: 'id'
    });
  }
  // ...
}
```

---

## Related Files

- `src/core/error.rs` - Rust error types and utilities
- `src/core/infrastructure/database/users.rs` - Example database operations
- `src/core/presentation/webui/handlers/db_handlers.rs` - Backend handlers
- `frontend/src/types/error.types.ts` - TypeScript error types
- `frontend/src/core/global-error.service.ts` - Error handling service
- `frontend/src/viewmodels/api-client.ts` - Backend API client
- `frontend/src/views/demo/error-handling-demo.component.ts` - Interactive demo

---

## Summary

The "Errors as Values" pattern provides:

1. **Type Safety**: Errors are part of function signatures
2. **Explicit Handling**: No hidden exceptions
3. **Better UX**: Structured errors enable user-friendly messages
4. **Consistency**: Same pattern across backend and frontend
5. **Testability**: Errors are values you can assert on

By embracing errors as values, you build more robust, maintainable, and user-friendly applications.
