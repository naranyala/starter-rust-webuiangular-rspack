// core/backend/src/plugin/mod.rs
//! Plugin System
//! 
//! Provides the infrastructure for loading and managing plugins.

mod registry;
mod context;
mod metadata;
mod traits;

pub use registry::PluginRegistry;
pub use context::PluginContext;
pub use traits::PluginMetadata;
pub use traits::Plugin;

use anyhow::Result;
use std::collections::HashMap;
use std::sync::Arc;

/// Plugin state
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PluginState {
    Unloaded,
    Loading,
    Loaded,
    Active,
    Error,
}

/// Plugin information
#[derive(Debug, Clone)]
pub struct PluginInfo {
    pub id: String,
    pub name: String,
    pub version: String,
    pub description: String,
    pub state: PluginState,
    pub dependencies: Vec<String>,
}

/// Plugin manager
pub struct PluginManager {
    registry: PluginRegistry,
    plugins: HashMap<String, Arc<dyn Plugin>>,
    contexts: HashMap<String, PluginContext>,
}

impl PluginManager {
    pub fn new() -> Self {
        Self {
            registry: PluginRegistry::new(),
            plugins: HashMap::new(),
            contexts: HashMap::new(),
        }
    }
    
    /// Register a plugin
    pub fn register(&mut self, plugin: Box<dyn Plugin>) -> Result<()> {
        let id = plugin.id().to_string();
        let context = PluginContext::new(&id);
        
        self.contexts.insert(id.clone(), context);
        self.plugins.insert(id, Arc::new(plugin));
        
        Ok(())
    }
    
    /// Load a plugin
    pub fn load(&mut self, plugin_id: &str) -> Result<()> {
        if let Some(plugin) = self.plugins.get(plugin_id) {
            let context = self.contexts.get_mut(plugin_id).unwrap();
            plugin.initialize(context)?;
            Ok(())
        } else {
            anyhow::bail!("Plugin not found: {}", plugin_id)
        }
    }
    
    /// Unload a plugin
    pub fn unload(&mut self, plugin_id: &str) -> Result<()> {
        if let Some(plugin) = self.plugins.get(plugin_id) {
            plugin.shutdown()?;
            Ok(())
        } else {
            anyhow::bail!("Plugin not found: {}", plugin_id)
        }
    }
    
    /// Get plugin info
    pub fn get_plugin_info(&self, plugin_id: &str) -> Option<PluginInfo> {
        self.plugins.get(plugin_id).map(|p| {
            let metadata = p.metadata();
            PluginInfo {
                id: p.id().to_string(),
                name: metadata.name.clone(),
                version: metadata.version.clone(),
                description: metadata.description.clone(),
                state: PluginState::Active,
                dependencies: metadata.dependencies.clone(),
            }
        })
    }
    
    /// List all plugins
    pub fn list_plugins(&self) -> Vec<PluginInfo> {
        self.plugins
            .keys()
            .filter_map(|id| self.get_plugin_info(id))
            .collect()
    }
}

impl Default for PluginManager {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_plugin_manager() {
        let mut manager = PluginManager::new();
        assert!(manager.list_plugins().is_empty());
    }
}
