// core/backend/src/application/events/mod.rs
//! Application Events

use serde::{Deserialize, Serialize};

/// Core event structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppEvent {
    pub event_type: String,
    pub payload: serde_json::Value,
    pub source: String,
}

impl AppEvent {
    pub fn new(event_type: &str, payload: serde_json::Value) -> Self {
        Self {
            event_type: event_type.to_string(),
            payload,
            source: "app".to_string(),
        }
    }
}
