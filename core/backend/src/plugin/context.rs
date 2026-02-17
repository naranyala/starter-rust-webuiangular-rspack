// core/backend/src/plugin/context.rs
//! Plugin Context
//! 
//! Provides plugins with access to core services.

use std::any::Any;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};

/// Plugin context - provides plugins with access to core services
pub struct PluginContext {
    plugin_id: String,
    services: Arc<Mutex<HashMap<String, Arc<dyn Any + Send + Sync>>>>,
    config: Arc<Mutex<HashMap<String, serde_json::Value>>>,
}

impl PluginContext {
    pub fn new(plugin_id: &str) -> Self {
        Self {
            plugin_id: plugin_id.to_string(),
            services: Arc::new(Mutex::new(HashMap::new())),
            config: Arc::new(Mutex::new(HashMap::new())),
        }
    }
    
    /// Get plugin ID
    pub fn plugin_id(&self) -> &str {
        &self.plugin_id
    }
    
    /// Register a service
    pub fn register_service<T: Any + Send + Sync>(&self, service: Arc<T>) {
        let mut services = self.services.lock().unwrap();
        let type_name = std::any::type_name::<T>().to_string();
        services.insert(type_name, service);
    }
    
    /// Get a service
    pub fn get_service<T: Any + Send + Sync>(&self) -> Option<Arc<T>> {
        let services = self.services.lock().unwrap();
        let type_name = std::any::type_name::<T>().to_string();
        services
            .get(&type_name)
            .and_then(|s| s.clone().downcast::<T>().ok())
    }
    
    /// Get configuration value
    pub fn get_config(&self, key: &str) -> Option<serde_json::Value> {
        let config = self.config.lock().unwrap();
        config.get(key).cloned()
    }
    
    /// Set configuration value
    pub fn set_config(&self, key: &str, value: serde_json::Value) {
        let mut config = self.config.lock().unwrap();
        config.insert(key.to_string(), value);
    }
    
    /// Log a message
    pub fn log(&self, level: &str, message: &str) {
        match level {
            "info" => log::info!("[Plugin:{}] {}", self.plugin_id, message),
            "warn" => log::warn!("[Plugin:{}] {}", self.plugin_id, message),
            "error" => log::error!("[Plugin:{}] {}", self.plugin_id, message),
            "debug" => log::debug!("[Plugin:{}] {}", self.plugin_id, message),
            _ => log::info!("[Plugin:{}] {}", self.plugin_id, message),
        }
    }
}
