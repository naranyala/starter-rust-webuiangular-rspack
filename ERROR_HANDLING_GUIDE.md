# Enhanced Error Handling & Logging Guide

This document describes the comprehensive error handling and logging system implemented for both the Rust backend and Angular frontend.

## 🎯 Overview

The error handling system is designed to:
1. **Catch bugs early** - All errors are captured at their source
2. **Expose errors to terminal** - Every error is logged with rich context
3. **Track error statistics** - Monitor error frequency and patterns
4. **Provide user-friendly messages** - Separate technical details from user messages
5. **Enable debugging** - Full stack traces and context available

---

## 🦀 Rust Backend

### 1. Enhanced Error Handler (`src/core/infrastructure/error_handler.rs`)

#### Features:
- **Panic Hook**: Captures all panics with stack traces
- **Error Tracking**: In-memory history of recent errors
- **Terminal Output**: Color-coded error messages
- **Severity Levels**: Info, Warning, Error, Critical

#### Usage:

```rust
use crate::core::infrastructure::error_handler;

// Record an AppError
error_handler::record_app_error("DB_HANDLER", &error);

// Record a custom error
error_handler::record_error(
    ErrorSeverity::Critical,
    "MAIN",
    ErrorCode::InternalError,
    "Something went wrong".to_string(),
    Some("Additional details".to_string()),
);

// Print error summary
error_handler::print_error_summary();
```

#### Macros:

```rust
// Record error with context
record_error!(ErrorSeverity::Error, "SOURCE", ErrorCode::ValidationFailed, "Message");

// Record AppError
record_app_error!("SOURCE", &error);
```

### 2. WebUI Error Handlers (`src/core/presentation/webui/handlers/error_handlers.rs`)

Exposes error information to the frontend:

```javascript
// Get error statistics
window.get_error_stats('error_stats');

// Get recent errors
window.get_recent_errors('get_recent_errors:10');

// Clear error history
window.clear_error_history('clear_error_history');
```

### 3. Terminal Output Format

```
[ERROR #1] 14:30:45.123 DB_HANDLER - DB_QUERY_FAILED
  Message: Failed to execute query
  Details: SQLite error code 19
  Context:
    - table: users
    - operation: insert
  Stack Trace:
    at src/core/infrastructure/database.rs:45
```

### 4. Error Summary on Shutdown

When the application exits, a summary is printed:

```
═══════════════════════════════════════════════════════
  ERROR SUMMARY
═══════════════════════════════════════════════════════
  Total Errors:   15
  Errors:         10
  Warnings:       4
  Critical:       1
═══════════════════════════════════════════════════════
```

---

## 🅰️ Angular Frontend

### 1. Error Interceptor (`src/core/error-interceptor.ts`)

Central error handling for all async operations.

#### Features:
- **WebUI Call Interception**: Catches all backend communication errors
- **HTTP Call Interception**: Catches all HTTP errors
- **Promise Rejection Handling**: Catches unhandled promise rejections
- **Global Error Handling**: Catches synchronous errors
- **Console Logging**: Color-coded terminal-style output
- **Statistics Tracking**: Tracks errors by source and code

#### Usage:

```typescript
import { errorInterceptor } from './core/error-interceptor';

// Intercept sync operations
errorInterceptor.interceptWebUICall('operation_name', () => {
  // risky operation
  return someValue;
});

// Intercept async operations
await errorInterceptor.interceptWebUIAsync('operation_name', async () => {
  // risky async operation
  return await somePromise;
});

// Get statistics
const stats = errorInterceptor.getStats();

// Print summary
errorInterceptor.printSummary();
```

### 2. Error Dashboard ViewModel (`src/viewmodels/error-dashboard.viewmodel.ts`)

Reactive state management for error data.

#### Features:
- **Real-time Stats**: Signals-based reactive state
- **Backend Integration**: Fetches errors from Rust backend
- **Frontend Tracking**: Tracks frontend-specific errors

#### Usage:

```typescript
import { ErrorDashboardVM } from './viewmodels/error-dashboard.viewmodel';

// Request stats from backend
ErrorDashboardVM.requestStats();

// Request recent errors
ErrorDashboardVM.requestRecentErrors(10);

// Clear history
ErrorDashboardVM.clearErrorHistory();

// Access reactive state
const stats = ErrorDashboardVM.stats();
const recentErrors = ErrorDashboardVM.recentErrors();
```

### 3. Error Dashboard Component (`src/views/shared/error-dashboard.component.ts`)

UI component for visualizing errors.

#### Features:
- **Stats Overview**: Total, Critical, Errors, Warnings
- **Recent Errors List**: Expandable error details
- **Color Coding**: Severity-based colors
- **Auto-refresh**: Updates every 5 seconds
- **Actions**: Refresh, Clear, Print to Console

#### Usage:

```html
<app-error-dashboard></app-error-dashboard>
```

### 4. Global Error Handler (`src/core/global-error.handler.ts`)

Angular's `ErrorHandler` implementation.

#### Features:
- **HTTP Error Detection**: Identifies HTTP errors
- **Error Code Mapping**: Maps error messages to error codes
- **Context Extraction**: Extracts useful context from errors

### 5. Console Output Format

```
[ERROR] 2024-02-21T14:30:45.123Z - Database Operation
├─ Source: webui
├─ Code: DB_QUERY_FAILED
├─ Message: Failed to execute query
├─ Details: Error: SQLITE_CONSTRAINT
└─ Context: { table: "users", operation: "insert" }
```

---

## 🔧 Configuration

### Biome Linter Configuration

The project uses Biome for linting with special rules for error handling files:

```json
{
  "overrides": [
    {
      "includes": ["**/core/error-interceptor.ts"],
      "linter": {
        "rules": {
          "suspicious": {
            "noConsole": "off"
          }
        }
      }
    }
  ]
}
```

### Debug API

The error system exposes debug information via global window objects:

```typescript
// Access error interceptor
window.__ERROR_INTERCEPTOR__.printSummary();

// Access log history
window.__FRONTEND_LOGS__.getHistory();
window.__FRONTEND_LOGS__.clear();
```

---

## 📊 Error Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      ERROR OCCURS                           │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┴───────────────────┐
        │                                       │
        ▼                                       ▼
┌───────────────┐                     ┌───────────────┐
│   FRONTEND    │                     │    BACKEND    │
│               │                     │               │
│ • Interceptor │                     │ • Panic Hook  │
│ • Global Err  │                     │ • Handlers    │
│ • WebUI Bind  │                     │ • Macros      │
└───────┬───────┘                     └───────┬───────┘
        │                                     │
        │             ┌────────────┐          │
        └────────────>│  WebUI FFI │<─────────┘
                      └─────┬──────┘
                            │
        ┌───────────────────┴───────────────────┐
        │                                       │
        ▼                                       ▼
┌───────────────┐                     ┌───────────────┐
│  CONSOLE LOG  │                     │  TERMINAL LOG │
│  (Color)      │                     │  (Color)      │
└───────────────┘                     └───────────────┘
        │                                       │
        └───────────────────┬───────────────────┘
                            │
                            ▼
                   ┌─────────────────┐
                   │  ERROR SUMMARY  │
                   │  (On Shutdown)  │
                   └─────────────────┘
```

---

## 🚀 Quick Start

### View Errors in Terminal

1. Run the application: `./run.sh`
2. All errors appear in the terminal with color coding
3. Error summary prints on shutdown

### View Errors in Browser

1. Open browser DevTools Console
2. Errors appear with structured formatting
3. Access dashboard: Add `<app-error-dashboard>` to a view

### Access Error Statistics

**Backend (Rust):**
```rust
let tracker = error_handler::get_error_tracker();
let summary = tracker.get_summary();
```

**Frontend (TypeScript):**
```typescript
const stats = errorInterceptor.getStats();
errorInterceptor.printSummary();
```

---

## 📝 Best Practices

### 1. Always Use Error Interceptors

```typescript
// ❌ Bad - No error handling
const result = riskyOperation();

// ✅ Good - Error captured
const result = errorInterceptor.interceptWebUICall(
  'operation_name',
  () => riskyOperation()
);
```

### 2. Provide Context

```rust
// ❌ Bad - Minimal context
let error = ErrorValue::new(code, "Failed");

// ✅ Good - Rich context
let error = ErrorValue::new(code, "Failed to insert user")
    .with_details("SQLITE_CONSTRAINT: UNIQUE constraint failed")
    .with_field("email")
    .with_context("table", "users")
    .with_context("operation", "insert");
```

### 3. Use Appropriate Severity

```rust
// Info - Expected events
ErrorSeverity::Info

// Warning - Recoverable issues
ErrorSeverity::Warning

// Error - Operation failures
ErrorSeverity::Error

// Critical - System-level issues
ErrorSeverity::Critical
```

### 4. Log Before Reporting

```typescript
// Log for debugging
logger.error('Operation failed', { operation: 'db_insert' }, error);

// Then report to user
errorService.report(errorValue, { source: 'db', title: 'Save Failed' });
```

---

## 🔍 Troubleshooting

### Errors Not Appearing in Terminal

1. Check log level in config: `config/app.config.toml`
2. Ensure `error_handler::init_error_handling()` is called in `main()`
3. Verify `RUST_LOG` environment variable

### Errors Not Appearing in Console

1. Check Biome config allows console in error files
2. Verify `setupGlobalErrorInterception()` is called in `main.ts`
3. Check browser console filters

### Error Dashboard Not Updating

1. Verify WebUI bindings are registered
2. Check error handlers are set up: `setup_error_handlers()`
3. Ensure event listeners are attached

---

## 📚 Files Reference

### Backend
| File | Purpose |
|------|---------|
| `src/core/infrastructure/error_handler.rs` | Core error handling |
| `src/core/presentation/webui/handlers/error_handlers.rs` | WebUI error bindings |
| `src/core/error.rs` | Error types and codes |

### Frontend
| File | Purpose |
|------|---------|
| `src/core/error-interceptor.ts` | Error interception |
| `src/core/global-error.handler.ts` | Angular error handler |
| `src/core/global-error.service.ts` | Error state management |
| `src/viewmodels/error-dashboard.viewmodel.ts` | Dashboard state |
| `src/views/shared/error-dashboard.component.ts` | Dashboard UI |

---

**Last Updated**: February 2026  
**Version**: 1.0.0
