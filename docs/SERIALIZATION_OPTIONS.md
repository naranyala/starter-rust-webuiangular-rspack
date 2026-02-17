# Backend-Frontend Serialization Options

## Overview

The application now supports multiple serialization formats for backend-frontend communication:

## Available Formats

### 1. **JSON** (Active/Default) ✅
- **Library**: `serde_json`
- **Size**: 1.0x (baseline)
- **Speed**: 1.0x (baseline)
- **Human Readable**: Yes
- **Browser Support**: Universal
- **Use Case**: Default, debugging, APIs

### 2. **MessagePack** (Available)
- **Library**: `rmp-serde`
- **Size**: ~0.7x (30% smaller than JSON)
- **Speed**: ~1.5x faster than JSON
- **Human Readable**: No (Binary)
- **Browser Support**: Needs library
- **Use Case**: Performance-critical applications

### 3. **CBOR** (Available)
- **Library**: `serde_cbor`
- **Size**: ~0.6x (40% smaller than JSON)
- **Speed**: ~1.6x faster than JSON
- **Human Readable**: No (Binary)
- **Browser Support**: Limited
- **Use Case**: Embedded systems, IoT, RFC 7049 compliance

## Terminal Log Output

When the application starts, you'll see:

```
INFO Backend-Frontend Communication Configuration:
INFO   ═══════════════════════════════════════════
INFO   TRANSPORT OPTIONS:
INFO   ┌─────────────────────────────────────────┐
INFO   │ ✓ WebView FFI (Native Binding) [ACTIVE] │
INFO   │   HTTP/REST (Not used)                  │
INFO   │   WebSocket Emulation (UI display)      │
INFO   └─────────────────────────────────────────┘
INFO   SERIALIZATION OPTIONS:
INFO   ┌────────────────────────────────────────────────────┐
INFO   │ Format       │ Size    │ Speed   │ Readable      │
INFO   ├────────────────────────────────────────────────────┤
INFO   │ ✓ JSON       │ 1.0x    │ 1.0x    │ Yes [ACTIVE]  │
INFO   │   MessagePack│ ~0.7x   │ ~1.5x   │ No (Binary)   │
INFO   │   CBOR       │ ~0.6x   │ ~1.6x   │ No (Binary)   │
INFO   └────────────────────────────────────────────────────┘
INFO   SELECTED CONFIGURATION:
INFO     Transport: WebView FFI (Native Binding)
INFO     Serialization: JSON (serde_json)
INFO     UI Status Display: WebSocket (emulated)
INFO   ALTERNATIVE FORMATS AVAILABLE:
INFO     - MessagePack: 30% smaller, 1.5x faster (binary)
INFO     - CBOR: 40% smaller, 1.6x faster (RFC 7049)
INFO   ═══════════════════════════════════════════════════
```

## Usage

### Current Implementation (JSON)

```rust
// Serialize
let json = serde_json::to_string(&data)?;

// Deserialize
let data: MyType = serde_json::from_str(&json)?;
```

### Switching to MessagePack

```rust
// Serialize
let bytes = rmp_serde::to_vec(&data)?;
let encoded = base64::encode(&bytes); // For text transport

// Deserialize
let bytes = base64::decode(&encoded)?;
let data: MyType = rmp_serde::from_slice(&bytes)?;
```

### Switching to CBOR

```rust
// Serialize
let bytes = serde_cbor::to_vec(&data)?;
let encoded = base64::encode(&bytes); // For text transport

// Deserialize
let bytes = base64::decode(&encoded)?;
let data: MyType = serde_cbor::from_slice(&bytes)?;
```

## Comparison Table

| Feature | JSON | MessagePack | CBOR |
|---------|------|-------------|------|
| **Format** | Text | Binary | Binary |
| **Size** | 100% | ~70% | ~60% |
| **Speed** | 1.0x | ~1.5x | ~1.6x |
| **Readability** | ✅ Human readable | ❌ Binary | ❌ Binary |
| **Browser Support** | ✅ Universal | ⚠️ Library needed | ⚠️ Limited |
| **Standard** | ECMA-404 | Community | RFC 7049 |
| **Type Safety** | Limited | ✅ Full | ✅ Full |
| **Binary Data** | Base64 needed | ✅ Native | ✅ Native |

## When to Use Each

### JSON (Recommended for most cases)
- Debugging and development
- REST APIs
- When human readability is important
- Maximum compatibility

### MessagePack
- Performance-critical applications
- High-frequency updates
- When payload size matters
- Internal service communication

### CBOR
- Embedded systems
- IoT devices
- When RFC standardization is required
- Very constrained environments

## Dependencies

```toml
[dependencies]
serde_json = "1.0"      # JSON (active)
rmp-serde = "1.3"       # MessagePack (available)
serde_cbor = "0.11"     # CBOR (available)
base64 = "0.21"         # For binary encoding
```

## Module Location

Serialization utilities are located in:
```
src/shared/serialization/mod.rs
```

Functions available:
- `serialize<T>(value: &T, format: SerializationFormat) -> Result<String, String>`
- `deserialize<T>(data: &str, format: SerializationFormat) -> Result<T, String>`
- `get_format_comparison() -> Vec<FormatComparison>`
