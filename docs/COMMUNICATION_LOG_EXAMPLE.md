# Backend-Frontend Communication Log Example

When you run the application, you will see output like this in the terminal:

## Startup Configuration Display

```
INFO [rustwebui-app] =============================================
INFO [rustwebui-app] Starting: Rust WebUI SQLite Demo v1.0.0
INFO [rustwebui-app] =============================================
INFO [rustwebui-app] Backend-Frontend Communication Configuration:
INFO [rustwebui-app]   Transport Options:
INFO [rustwebui-app]     - WebView FFI (Native Binding) [SELECTED]
INFO [rustwebui-app]     - HTTP/REST (Not used)
INFO [rustwebui-app]     - WebSocket (Not used)
INFO [rustwebui-app]   Serialization Options:
INFO [rustwebui-app]     - JSON via serde_json [SELECTED]
INFO [rustwebui-app]     - Protocol Buffers (Not used)
INFO [rustwebui-app]     - MessagePack (Not used)
INFO [rustwebui-app]   Selected Configuration:
INFO [rustwebui-app]     Transport: WebView FFI (Native Binding)
INFO [rustwebui-app]     Serialization: JSON (serde_json)
INFO [rustwebui-app]   Communication Flow:
INFO [rustwebui-app]     Frontend JS --[JSON]--> window.bind() handlers --[Rust]--> Backend
INFO [rustwebui-app]     Backend --[JSON]--> window.run_js() dispatchEvent --> Frontend JS
INFO [rustwebui-app] =============================================
```

## Runtime Communication Events

When frontend triggers events, you'll see:

```
INFO [rustwebui-app] [Communication] Frontend → Backend (get_users): JSON/FFI call received
INFO [rustwebui-app] get_users called from frontend
INFO [rustwebui-app] [Communication] Backend → Frontend (get_users): JSON response sent via dispatchEvent

INFO [rustwebui-app] [Communication] Frontend → Backend (event:publish): JSON payload received
INFO [rustwebui-app] [Communication] Backend → Frontend: JSON response sent
```

## Architecture Summary

| Aspect | Technology | Status |
|--------|------------|--------|
| **Transport** | WebView FFI (Native Binding) | ✅ Selected |
| **Serialization** | JSON (serde_json) | ✅ Selected |
| **UI Framework** | webui-rs (WebView) | ✅ Active |
| **Event System** | Custom EventBus | ✅ Active |

## Communication Flow Diagram

```
┌─────────────┐                          ┌─────────────┐
│  Frontend   │                          │   Backend   │
│ (JavaScript)│                          │    (Rust)   │
└──────┬──────┘                          └──────┬──────┘
       │                                        │
       │  1. window.bind("event_name", cb)      │
       │<───────────────────────────────────────│
       │                                        │
       │  2. Event triggered (JSON payload)     │
       │────────────────────────────────────────>
       │                                        │
       │  3. Process in Rust (serde_json parse) │
       │                                        │
       │  4. Response (JSON via dispatchEvent)  │
       │<───────────────────────────────────────│
       │                                        │
       │  5. Frontend receives via eventListener│
       │                                        │
```
