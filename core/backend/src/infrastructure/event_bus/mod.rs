// core/backend/src/infrastructure/event_bus/mod.rs
//! Event Bus

use std::sync::{Arc, Mutex};
use crate::application::events::AppEvent;

/// Event handler callback
pub type EventHandler = Box<dyn Fn(&AppEvent) + Send + Sync>;

/// Event Bus for pub/sub messaging
#[derive(Default)]
pub struct EventBus {
    handlers: Arc<Mutex<std::collections::HashMap<String, Vec<EventHandler>>>>,
}

impl EventBus {
    pub fn new() -> Self {
        Self::default()
    }
    
    pub fn subscribe<F>(&self, event_type: &str, handler: F)
    where
        F: Fn(&AppEvent) + Send + Sync + 'static,
    {
        let mut handlers = self.handlers.lock().unwrap();
        handlers
            .entry(event_type.to_string())
            .or_insert_with(Vec::new)
            .push(Box::new(handler));
    }
    
    pub fn publish(&self, event: AppEvent) {
        let handlers = self.handlers.lock().unwrap();
        if let Some(handlers) = handlers.get(&event.event_type) {
            for handler in handlers {
                handler(&event);
            }
        }
    }
}

/// Global event bus
lazy_static::lazy_static! {
    pub static ref GLOBAL_EVENT_BUS: EventBus = EventBus::new();
}
