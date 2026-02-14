#![allow(dead_code)]

use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct EventData {
    pub event_type: String,
    pub payload: serde_json::Value,
    pub timestamp: i64,
    pub source: Option<String>,
    pub target: Option<String>,
}

impl EventData {
    pub fn new(event_type: impl Into<String>, payload: serde_json::Value) -> Self {
        Self {
            event_type: event_type.into(),
            payload,
            timestamp: Utc::now().timestamp_millis(),
            source: None,
            target: None,
        }
    }

    pub fn with_source(mut self, source: impl Into<String>) -> Self {
        self.source = Some(source.into());
        self
    }

    pub fn with_target(mut self, target: impl Into<String>) -> Self {
        self.target = Some(target.into());
        self
    }
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct EventBusStats {
    pub total_listeners: usize,
    pub event_types: Vec<EventTypeInfo>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct EventTypeInfo {
    pub event_type: String,
    pub listener_count: usize,
}

pub struct EventBus {
    history: Mutex<Vec<EventData>>,
    max_history: usize,
}

impl EventBus {
    pub fn new(max_history: usize) -> Self {
        Self {
            history: Mutex::new(Vec::new()),
            max_history,
        }
    }

    pub fn emit(&self, event_type: &str, payload: serde_json::Value) {
        let event = EventData::new(event_type, payload);
        self.store_event(event);
    }

    pub fn emit_with_source(&self, event_type: &str, payload: serde_json::Value, source: &str) {
        let event = EventData::new(event_type, payload).with_source(source);
        self.store_event(event);
    }

    fn store_event(&self, event: EventData) {
        let mut history = self.history.lock().unwrap();
        history.push(event);
        if history.len() > self.max_history {
            history.remove(0);
        }
    }

    pub fn get_history(&self, event_type: Option<&str>, limit: Option<usize>) -> Vec<EventData> {
        let history = self.history.lock().unwrap();

        let filtered: Vec<EventData> = match event_type {
            Some(et) => history
                .iter()
                .filter(|e| e.event_type == et)
                .cloned()
                .collect(),
            None => history.clone(),
        };

        match limit {
            Some(l) => filtered.into_iter().rev().take(l).collect(),
            None => filtered,
        }
    }

    pub fn clear_history(&self) {
        let mut history = self.history.lock().unwrap();
        history.clear();
    }

    pub fn listener_count(&self, _event_type: &str) -> usize {
        0
    }

    pub fn total_listeners(&self) -> usize {
        0
    }

    pub fn get_stats(&self) -> EventBusStats {
        EventBusStats {
            total_listeners: 0,
            event_types: vec![],
        }
    }
}

impl Default for EventBus {
    fn default() -> Self {
        Self::new(100)
    }
}

lazy_static::lazy_static! {
    pub static ref GLOBAL_EVENT_BUS: EventBus = EventBus::new(100);
}

#[macro_export]
macro_rules! event_publish {
    ($event_type:expr, $payload:expr) => {
        $crate::infrastructure::event_bus::GLOBAL_EVENT_BUS.emit($event_type, $payload)
    };
}
