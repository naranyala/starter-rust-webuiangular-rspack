# Errors as Values - Implementation Guide

## Overview

This project now uses the **"errors as values"** pattern for explicit, composable, and testable error handling in both backend (Rust) and frontend (TypeScript).

## Philosophy

Instead of throwing exceptions that can be caught anywhere in the call stack, errors are:
- **Returned as values** - Must be explicitly handled
- **Typed** - Error types are part of function signatures
- **Composable** - Can be transformed and combined
- **Traceable** - Carry context and cause information

## Backend (Rust)

### Error Hierarchy

```
AppError
├── DomainError
│   ├── NotFound
│   ├── Validation
│   ├── BusinessRule
│   └── Conflict
├── InfrastructureError
│   ├── Database
│   ├── Network
│   └── Serialization
├── ApplicationError
│   ├── InvalidState
│   ├── Timeout
│   ├── Canceled
│   └── Internal
└── PluginError
    ├── NotFound
    ├── LoadFailed
    └── InitFailed
```

### Usage Examples

#### Basic Error Handling

```rust
use rustwebui_core::prelude::*;

// Function that can fail
fn find_user(id: &str) -> Result<User> {
    // Return error as value
    if id.is_empty() {
        return validation_error!("id", "ID cannot be empty");
    }
    
    // Use ? operator to propagate errors
    let user = database.get(id)?;
    
    // Convert Option to Result
    user.ok_or_not_found("User", id)
}

// Handle errors explicitly
match find_user("123") {
    Ok(user) => println!("Found: {}", user.name),
    Err(e) if e.is_not_found() => println!("User not found"),
    Err(e) if e.is_validation() => println!("Invalid input"),
    Err(e) => eprintln!("Error: {}", e),
}
```

#### Adding Context

```rust
fn process_user(id: &str) -> Result<User> {
    find_user(id)
        .context("Failed to process user")
        .map_err(|e| e.with_context("user_id", id))
}
```

#### Error Builder Pattern

```rust
let error = ErrorBuilder::new(AppError::validation("email", "Invalid"))
    .message("Email validation failed")
    .context("user_id", "123")
    .context("attempt", "3")
    .build();
```

#### Using Macros

```rust
// Validation error
return validation_error!("age", "Must be positive");

// Validation with value
return validation_error!("email", "Invalid format", user_input);

// Not found error
return not_found_error!("Product", product_id);
```

#### Pattern Matching

```rust
use rustwebui_core::error::{match, pipe};

let result = find_user("123");

// Match on result
let output = match(result, {
    ok: |user| format!("Found: {}", user.name),
    err: |e| format!("Error: {}", e),
});

// Pipe through transformations
pipe(result)
    .map(|user| user.to_dto())
    .map_err(|e| log_error(e))
    .unwrap_or(default_user);
```

### Error Handler

```rust
use rustwebui_core::error::ErrorHandler;

let handler = ErrorHandler::new()
    .with_backtrace(true)  // Debug mode
    .with_source(true);    // Include error chain

let error = find_user("123").unwrap_err();
let response = handler.handle(&error);

// response.to_json() for API responses
println!("{}", response.to_json());
```

## Frontend (TypeScript)

### Error Hierarchy

```typescript
AppError
├── DomainError
│   ├── NotFound
│   ├── Validation
│   ├── BusinessRule
│   └── Conflict
├── InfrastructureError
│   ├── Database
│   ├── Network
│   └── Serialization
├── ApplicationError
│   ├── InvalidState
│   ├── Timeout
│   └── Canceled
└── PluginError
    ├── NotFound
    ├── LoadFailed
    └── InitFailed
```

### Usage Examples

#### Basic Error Handling

```typescript
import { Result, errors, ErrorHandler } from '@core/error';

// Function that returns Result
async function getUser(id: string): Promise<Result<User>> {
  if (!id) {
    return Result.err(errors.validation('id', 'ID is required'));
  }
  
  const user = await db.find(id);
  if (!user) {
    return Result.err(errors.notFound('User', id));
  }
  
  return Result.ok(user);
}

// Handle errors explicitly
const result = await getUser('123');
if (result.isErr) {
  if (result.error instanceof DomainError.NotFound) {
    console.log('User not found');
  }
} else {
  console.log('Found:', result.value.name);
}
```

#### Using Match

```typescript
import { match, pipe } from '@core/error';

const result = await getUser('123');

// Pattern matching
const output = match(result, {
  ok: (user) => `Found: ${user.name}`,
  err: (error) => `Error: ${error.message}`,
});

// Pipe transformations
const dto = pipe(result)
  .map(user => user.toDTO())
  .mapError(error => logError(error))
  .unwrapOr(defaultUser);
```

#### Error Handler

```typescript
import { globalErrorHandler, setupGlobalErrorHandling } from '@core/error';

// Setup global error handling
setupGlobalErrorHandling();

// Handle specific errors
globalErrorHandler.on('NOT_FOUND', (error) => {
  showNotFoundUI();
});

globalErrorHandler.on('VALIDATION_ERROR', (error) => {
  showValidationMessage(error.context.field, error.message);
});

// Handle Result
const result = await getUser('123');
globalErrorHandler.handleResult(result, {
  onSuccess: (user) => showUser(user),
  onError: (display) => showError(display.userMessage),
});
```

#### Async Error Handling

```typescript
// Handle async Result
const user = await globalErrorHandler.handleResultAsync(
  getUser('123'),
  {
    onSuccess: (user) => console.log('Loaded:', user),
    onError: (display) => toast.error(display.userMessage),
  }
);
```

## Comparison: Exceptions vs Errors as Values

### Exceptions (Old Way)

```rust
// ❌ Implicit error flow
fn find_user(id: &str) -> User {
    if id.is_empty() {
        panic!("ID cannot be empty");  // Hidden in type signature
    }
    // ...
}

// Caller might forget to handle
let user = find_user("");  // Crashes!
```

```typescript
// ❌ Try-catch anywhere
async function getUser(id: string): Promise<User> {
  if (!id) {
    throw new Error('ID required');  // Not in type signature
  }
}

// Easy to forget error handling
const user = await getUser('');  // Unhandled rejection
```

### Errors as Values (New Way)

```rust
// ✅ Explicit error flow
fn find_user(id: &str) -> Result<User> {
    if id.is_empty() {
        return validation_error!("id", "ID cannot be empty");
    }
    // ...
}

// Must handle explicitly
match find_user("") {
    Ok(user) => use(user),
    Err(e) => handle(e),  // Forced to handle
}
```

```typescript
// ✅ Explicit in type
async function getUser(id: string): Promise<Result<User>> {
  if (!id) {
    return Result.err(errors.validation('id', 'ID required'));
  }
}

// Type forces handling
const result = await getUser('');
if (result.isErr) {  // Must check
  handle(result.error);
}
```

## Benefits

| Benefit | Description |
|---------|-------------|
| **Explicit** | Errors visible in function signatures |
| **Composable** | Chain operations with map/andThen |
| **Testable** | Errors are regular values |
| **Traceable** | Carry context and cause |
| **Type-safe** | Compiler enforces handling |
| **No surprises** | No hidden control flow |

## Migration Guide

### Backend

1. Replace `throw` with `return Err(...)`
2. Change return types to `Result<T>`
3. Use `?` operator for propagation
4. Use `match` or `if let` for handling

### Frontend

1. Replace `throw` with `return Result.err(...)`
2. Change return types to `Promise<Result<T>>`
3. Use `.map()` and `.andThen()` for chaining
4. Use `match()` or check `isErr` for handling

## Files

### Backend
- `core/backend/src/error/mod.rs` - Module root
- `core/backend/src/error/kinds.rs` - Error types
- `core/backend/src/error/error.rs` - Error struct
- `core/backend/src/error/result_ext.rs` - Result extensions
- `core/backend/src/error/handler.rs` - Error handler

### Frontend
- `core/frontend/src/error/index.ts` - Module root
- `core/frontend/src/error/result.ts` - Result type
- `core/frontend/src/error/errors.ts` - Error classes
- `core/frontend/src/error/handler.ts` - Error handler
