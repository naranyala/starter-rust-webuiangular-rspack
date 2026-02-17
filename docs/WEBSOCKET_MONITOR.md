# WebSocket Connection Monitor/Tracker - Bottom Panel

## Overview

The bottom panel now displays comprehensive WebSocket connection monitoring information with real-time statistics.

## Features

### Collapsed View (Default)
Shows a compact status line:
```
WebSocket: connected :45211
WebSocket: connecting - init
WebSocket: disconnected - no_webui
WebSocket: retrying - ping_failed
```

### Expanded View (Click "Expand")
Shows detailed connection statistics:

```
┌─────────────────────────────────────────────────────────────────┐
│ WebSocket: connected :45211                              [Collapse] │
├─────────────────────────────────────────────────────────────────┤
│ Status: connected    Port: :45211     Latency: 2ms              │
│ Uptime: 1h 23m 45s   Reconnects: 0    Ping Success: 100%        │
│ Total Calls: 15/15   Last Error: -                               │
└─────────────────────────────────────────────────────────────────┘
```

## Tracked Metrics

### Connection State
- **Status**: Current connection state (connected, connecting, disconnected, retrying, error)
- Color-coded status indicator:
  - 🟢 **connected**: Green background
  - 🔵 **connecting**: Blue background
  - ⚪ **disconnected**: Gray background
  - 🟡 **retrying**: Yellow background
  - 🔴 **error**: Red background

### Network Statistics
- **Port**: WebSocket server port number
- **Latency**: Average ping/pong latency (rolling 10-sample average)
- **Uptime**: Total connection uptime (formatted as days/hours/minutes/seconds)

### Reliability Metrics
- **Reconnects**: Total number of reconnection attempts
- **Ping Success**: Success rate of heartbeat pings (e.g., "98.5%")
- **Total Calls**: Successful/Total backend function calls (e.g., "15/15")

### Error Tracking
- **Last Error**: Most recent error message (truncated if >30 chars)

## Technical Implementation

### Frontend (`frontend/src/utils.js`)
```javascript
// Enhanced connection tracking in WebUIBridge class
this.connectionStats = {
  connectedAt: null,
  disconnectedAt: null,
  uptime: 0,
  totalReconnects: 0,
  totalPings: 0,
  successfulPings: 0,
  failedPings: 0,
  lastPingTime: null,
  lastPongTime: null,
  averageLatency: 0,
  latencyHistory: [],  // Rolling 10-sample window
  totalCalls: 0,
  successfulCalls: 0,
  failedCalls: 0
};
```

### Frontend (`frontend/src/use-cases/App.ts`)
- `updateConnectionDetails()`: Updates all metrics in real-time
- Periodic refresh every 1 second when panel is expanded
- Event-driven updates on state changes

### Styling (`frontend/src/styles/app.css`)
- Color-coded status indicators
- Smooth transitions for expand/collapse
- Responsive layout for connection details

## Usage

1. **View Status**: Bottom panel always shows current connection state
2. **Expand Details**: Click "Expand" button to see detailed metrics
3. **Real-time Updates**: Metrics update automatically every second
4. **Collapse**: Click "Collapse" to return to compact view

## Backend Logging

Connection events are logged to the backend:
```
INFO [Communication] Frontend → Backend (event:publish): JSON payload received
INFO [Communication] Backend → Frontend: JSON response sent
```

## Communication Flow

```
┌─────────────┐                          ┌─────────────┐
│  Frontend   │                          │   Backend   │
│ (JavaScript)│                          │    (Rust)   │
└──────┬──────┘                          └──────┬──────┘
       │                                        │
       │  1. Heartbeat Ping (every 2s)          │
       │────────────────────────────────────────>
       │                                        │
       │  2. Latency Measurement                │
       │  3. Success/Failure Tracking           │
       │                                        │
       │  4. Stats Update (UI)                  │
       │<───────────────────────────────────────│
       │                                        │
```

## Configuration

Default settings in `WebUIBridge`:
- Ping Interval: 2000ms
- Ping Timeout: 2000ms
- Latency History: 10 samples (rolling average)
- UI Refresh: 1000ms (when expanded)
