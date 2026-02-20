# Communication Architecture

## Overview

The application implements a bidirectional communication layer between frontend (Angular/TypeScript) and backend (Rust) using the WebUI framework's binding system.

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
window.get_users();

// Or with parameters via element name
const elementName = `create_user:${name}:${email}:${role}:${status}`;
window.create_user(elementName);
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

**Get History:**
```rust
let events = GLOBAL_EVENT_BUS.get_history(
    Some("user.created"),
    Some(10)
)?;
```

### Frontend Event Bus

Frontend has its own event bus for component communication:

```typescript
// Publish
this.eventBus.publish('user.updated', { id: 123 });

// Subscribe
const unsubscribe = this.eventBus.subscribe('user.updated', (payload) => {
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

**Success Response Format:**
```json
{
  "success": true,
  "data": {...},
  "message": "Operation completed"
}
```

**Error Response Format:**
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "User not found",
    "field": "id",
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
            "data": null,
            "error": e.to_value().to_response()
        });
        send_response(window, "user_response", &response);
    }
}
```

### Frontend Error Handling

```typescript
const result = await getUsers();

if (result.ok) {
    // Success path
    displayUser(result.value);
} else {
    // Error path - error is a value
    errorService.report(result.error);
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
window.log_message(JSON.stringify({ level: 'info', message: 'User action' }));

// Backend
window.bind("log_message", |event| {
    log::info!("Frontend: {}", event.payload);
    // No response needed
});
```

## Connection Status

The application displays connection status information:

- Status: connected, connecting, disconnected, retrying, error
- Port: Backend server port
- Latency: Average ping/pong latency
- Uptime: Connection uptime
- Reconnects: Number of reconnection attempts
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

Error messages sent to frontend are sanitized to avoid leaking internal details:

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

```typescript
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

```typescript
logger.info('Calling backend: get_users', { params });
```
