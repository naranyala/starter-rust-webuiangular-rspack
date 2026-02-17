# Communication Architecture

## Overview

The application implements a bidirectional communication layer between frontend (JavaScript) and backend (Rust) using the WebUI framework's binding system.

## Communication Flow

### Frontend to Backend

1. JavaScript triggers an event via WebUI binding
2. Event payload is serialized to JSON
3. Rust backend receives the event through bound handler
4. Handler processes the request
5. Response is prepared and serialized

### Backend to Frontend

1. Rust backend prepares response data
2. Response is serialized to JSON
3. JavaScript event is dispatched via window.dispatchEvent
4. Frontend event listener receives the response
5. UI is updated based on response data

## WebUI Bindings

### Backend Binding Registration

Rust handlers are registered with WebUI:

```rust
window.bind("get_users", |event| {
    // Handle get_users request
    let users = db.get_all_users()?;
    
    // Send response to frontend
    let response = serde_json::json!({
        "success": true,
        "data": users,
        "count": users.len()
    });
    
    send_response(window, "db_response", &response);
});
```

### Frontend Event Dispatch

JavaScript sends requests to backend:

```javascript
// Call backend function
window.__webui__.call('get_users', JSON.stringify({}));

// Or using WebUIBridge
await window.WebUIBridge.callRustFunction('get_users', {});
```

### Frontend Event Listening

JavaScript listens for backend responses:

```javascript
window.addEventListener('db_response', (event) => {
    const response = event.detail;
    if (response.success) {
        // Handle successful response
        console.log('Users:', response.data);
    } else {
        // Handle error
        console.error('Error:', response.error);
    }
});
```

## Event Bus System

### Backend Event Bus

The application includes an event bus for pub/sub messaging:

**Publish Event:**
```rust
use crate::infrastructure::event_bus::GLOBAL_EVENT_BUS;

GLOBAL_EVENT_BUS.emit("user.created", json!({
    "user_id": 123,
    "name": "John Doe"
}));
```

**Subscribe to Event:**
```rust
GLOBAL_EVENT_BUS.subscribe("user.created", |event| {
    log::info!("User created: {:?}", event);
});
```

### Frontend Event Bus

Frontend has its own event bus for component communication:

```typescript
import { EventBus } from '@core/error';

const eventBus = EventBus.getInstance();

// Publish
eventBus.publish('user.updated', { id: 123 });

// Subscribe
const unsubscribe = eventBus.subscribe('user.updated', (payload) => {
    console.log('User updated:', payload);
});

// Unsubscribe
unsubscribe();
```

## Data Serialization

### JSON Format

All communication uses JSON for data serialization:

**Request Format:**
```json
{
  "event_type": "get_users",
  "payload": {
    "filter": "active"
  },
  "timestamp": 1234567890
}
```

**Response Format:**
```json
{
  "success": true,
  "data": [...],
  "count": 10,
  "message": "Operation completed"
}
```

**Error Format:**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "User not found",
    "context": {
      "user_id": "123"
    }
  }
}
```

## Error Handling

### Backend Error Response

```rust
match get_user(id) {
    Ok(user) => {
        let response = json!({
            "success": true,
            "data": user
        });
        send_response(window, "user_response", &response);
    }
    Err(e) => {
        let response = json!({
            "success": false,
            "error": {
                "code": e.code(),
                "message": e.to_string()
            }
        });
        send_response(window, "user_response", &response);
    }
}
```

### Frontend Error Handling

```javascript
try {
    const result = await callBackend('get_user', { id: 123 });
    if (result.success) {
        displayUser(result.data);
    } else {
        showError(result.error.message);
    }
} catch (error) {
    logError(error);
    showGenericError();
}
```

## Communication Patterns

### Request-Response

Synchronous request with immediate response:

```javascript
// Frontend
const response = await callBackend('get_data', params);

// Backend
window.bind("get_data", |event| {
    let data = fetch_data();
    send_response(window, "get_data_response", &data);
});
```

### Publish-Subscribe

Asynchronous event broadcasting:

```javascript
// Frontend - Subscribe
window.addEventListener('data.updated', handleUpdate);

// Backend - Publish
GLOBAL_EVENT_BUS.emit("data.updated", payload);
```

### Command Pattern

Fire-and-forget commands:

```javascript
// Frontend
callBackend('log_message', { level: 'info', message: 'User action' });

// Backend
window.bind("log_message", |event| {
    log::info!("Frontend: {}", event.payload);
    // No response needed
});
```

## WebSocket Emulation

The bottom panel displays WebSocket-style connection status:

- Status: connected, connecting, disconnected, retrying, error
- Port: Backend server port
- Latency: Average ping/pong latency
- Uptime: Connection uptime
- Reconnects: Number of reconnection attempts
- Ping Success: Heartbeat success rate
- Total Calls: Successful/Total backend calls

## Security Considerations

### Input Validation

All frontend inputs are validated on the backend:

```rust
fn create_user(name: &str, email: &str) -> Result<User> {
    // Validate input
    if name.is_empty() {
        return validation_error!("name", "Name is required");
    }
    
    if !is_valid_email(email) {
        return validation_error!("email", "Invalid email format");
    }
    
    // Proceed with creation
}
```

### Error Message Sanitization

Error messages sent to frontend are sanitized:

```rust
let safe_message = sanitize_error_message(&error);
let response = json!({
    "success": false,
    "error": safe_message
});
```

## Performance Optimization

### Batching

Multiple operations can be batched:

```javascript
// Batch multiple requests
const results = await Promise.all([
    callBackend('get_users'),
    callBackend('get_products'),
    callBackend('get_orders')
]);
```

### Debouncing

Frequent events are debounced:

```javascript
const debouncedSearch = debounce(async (query) => {
    const results = await callBackend('search', { query });
    displayResults(results);
}, 300);
```

## Monitoring and Logging

### Backend Logging

All communication is logged:

```
INFO [Communication] Frontend -> Backend (get_users): JSON payload received
INFO [Communication] Backend -> Frontend: JSON response sent
```

### Frontend Logging

Frontend events are logged to console and backend:

```javascript
logger.info('Calling backend: get_users', { params });
```
