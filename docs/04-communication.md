# Communication Architecture

> **Note**: This document is being updated. For current communication patterns, see:
> - [Architecture](02-architecture.md) - Complete architecture guide
> - [ERROR_HANDLING_GUIDE.md](../ERROR_HANDLING_GUIDE.md) - Error communication

## Overview

The application uses **WebUI bindings** for bidirectional IPC between frontend (Angular/TypeScript) and backend (Rust).

## Communication Flow

### Frontend → Backend

```javascript
// 1. Frontend calls backend function
window.get_users();

// 2. Backend receives event
window.bind("get_users", |event| {
    // Handle request
});

// 3. Backend sends response
dispatch_event(window, "db_response", &response);

// 4. Frontend listens for response
window.addEventListener('db_response', (event) => {
    const data = event.detail;
    // Update UI
});
```

### Backend → Frontend

```rust
// 1. Backend prepares data
let response = json!({
    "success": true,
    "data": users
});

// 2. Dispatch JavaScript event
let js = format!(
    "window.dispatchEvent(new CustomEvent('users_loaded', {{ detail: {} }}))",
    response
);
window.run_js(&js);
```

## WebUI Bindings

### Backend Registration

```rust
pub fn setup_db_handlers(window: &mut webui::Window) {
    // Simple handler
    window.bind("get_users", |event| {
        let users = db.get_all_users()?;
        send_response(window, "db_response", &users);
    });
    
    // Handler with parameters (via element name)
    window.bind("create_user", |event| {
        let element_name = unsafe {
            CStr::from_ptr(event.element).to_string_lossy()
        };
        let parts: Vec<&str> = element_name.split(':').collect();
        let name = parts[1];
        let email = parts[2];
        
        // Create user...
    });
}
```

### Frontend Usage

```typescript
// Call without parameters
window.get_users();

// Call with parameters (via element name convention)
const elementName = `create_user:${name}:${email}:${role}`;
window.create_user(elementName);

// Listen for response
window.addEventListener('db_response', (event: CustomEvent) => {
    const { success, data, error } = event.detail;
    if (success) {
        console.log('Users:', data);
    } else {
        console.error('Error:', error);
    }
});
```

## Event Bus System

### Frontend Event Bus

```typescript
@Injectable({ providedIn: 'root' })
export class EventBusViewModel<Events extends object> {
  // Subscribe to event
  subscribe<K extends keyof Events>(
    name: K,
    handler: Handler<Events[K]>
  ): () => void {
    // Register handler
    // Return unsubscribe function
  }
  
  // Publish event
  publish<K extends keyof Events>(
    name: K,
    payload: Events[K]
  ): void {
    // Create event
    // Add to history
    // Dispatch to subscribers
  }
}

// Usage
eventBus.subscribe('user:created', (payload) => {
    console.log('User created:', payload);
});

eventBus.publish('user:created', { id: 123, name: 'Alice' });
```

### Backend Event Bus

```rust
pub struct EventBus {
    subscribers: Mutex<HashMap<String, Vec<Handler>>>,
}

impl EventBus {
    pub fn subscribe(&self, event: &str, handler: Handler) {
        // Register handler
    }
    
    pub fn publish(&self, event: &str, payload: &Value) {
        // Dispatch to all subscribers
    }
}
```

## Error Communication

### Error Flow

```
User Action
    ↓
Frontend Component
    ↓
Backend Handler
    ↓
Error Occurs
    ↓
Error Handler (record error)
    ↓
Terminal Output (color-coded)
    ↓
Frontend Event (dispatched)
    ↓
Error Service (update state)
    ↓
Error Modal (display to user)
```

### Error Response Format

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: string;
    field?: string;
    context?: Record<string, string>;
  };
}
```

## DevTools Monitoring

The DevTools panel exposes all communication:

- **Backend Tab**: View WebUI bindings, backend logs
- **Frontend Tab**: View events, errors, event bus stats
- **Events Tab**: View event history and payloads

## Related Documentation

- [Architecture](02-architecture.md) - Complete communication flow
- [Error Handling Guide](../ERROR_HANDLING_GUIDE.md) - Error patterns
- [DevTools Component](../frontend/src/views/devtools/devtools.component.ts) - Implementation
