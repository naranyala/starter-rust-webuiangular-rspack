// core/backend/src/plugin/traits.rs
//! Plugin Traits
//! 
//! Defines the core plugin interface that all plugins must implement.

use super::context::PluginContext;
use anyhow::Result;

/// Core plugin trait that all plugins must implement
#[async_trait::async_trait]
pub trait Plugin: Send + Sync {
    /// Get plugin unique identifier
    fn id(&self) -> &str;
    
    /// Get plugin metadata
    fn metadata(&self) -> &PluginMetadata;
    
    /// Initialize the plugin
    /// Called when the plugin is loaded
    async fn initialize(&mut self, ctx: &PluginContext) -> Result<()>;
    
    /// Shutdown the plugin
    /// Called when the plugin is unloaded
    async fn shutdown(&mut self) -> Result<()>;
    
    /// Get event handlers provided by this plugin
    fn get_handlers(&self) -> Vec<EventHandler> {
        vec![]
    }
    
    /// Get services provided by this plugin
    fn get_services(&self) -> Vec<Box<dyn std::any::Any + Send + Sync>> {
        vec![]
    }
    
    /// Called when a plugin event is received
    async fn on_event(&self, _event: &Event) -> Result<()> {
        Ok(())
    }
}

/// Plugin metadata
#[derive(Debug, Clone)]
pub struct PluginMetadata {
    pub name: String,
    pub version: String,
    pub description: String,
    pub author: Option<String>,
    pub dependencies: Vec<String>,
    pub core_version: String,
}

impl PluginMetadata {
    pub fn new(name: &str, version: &str, description: &str) -> Self {
        Self {
            name: name.to_string(),
            version: version.to_string(),
            description: description.to_string(),
            author: None,
            dependencies: vec![],
            core_version: ">=1.0.0".to_string(),
        }
    }
    
    pub fn with_author(mut self, author: &str) -> Self {
        self.author = Some(author.to_string());
        self
    }
    
    pub fn with_dependencies(mut self, deps: Vec<&str>) -> Self {
        self.dependencies = deps.iter().map(|s| s.to_string()).collect();
        self
    }
}

/// Event handler
pub struct EventHandler {
    pub name: String,
    pub handler: Box<dyn Fn(&EventContext) -> Result<String> + Send + Sync>,
}

impl EventHandler {
    pub fn new<F>(name: &str, handler: F) -> Self
    where
        F: Fn(&EventContext) -> Result<String> + Send + Sync + 'static,
    {
        Self {
            name: name.to_string(),
            handler: Box::new(handler),
        }
    }
}

/// Event context
pub struct EventContext {
    pub event_name: String,
    pub payload: String,
    pub window_id: usize,
}

/// Event
#[derive(Debug, Clone)]
pub struct Event {
    pub event_type: String,
    pub payload: serde_json::Value,
    pub source: String,
    pub timestamp: i64,
}

impl Event {
    pub fn new(event_type: &str, payload: serde_json::Value) -> Self {
        Self {
            event_type: event_type.to_string(),
            payload,
            source: "system".to_string(),
            timestamp: chrono::Utc::now().timestamp_millis(),
        }
    }
}
