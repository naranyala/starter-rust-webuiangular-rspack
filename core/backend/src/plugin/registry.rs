// core/backend/src/plugin/registry.rs
//! Plugin Registry
//! 
//! Manages plugin registration and discovery.

use super::metadata::PluginMetadataFile;
use anyhow::{Result, Context};
use std::path::Path;
use std::sync::{Arc, Mutex};

/// Plugin entry in registry
#[derive(Debug, Clone)]
pub struct PluginEntry {
    pub id: String,
    pub path: String,
    pub metadata: PluginMetadataFile,
    pub enabled: bool,
}

/// Plugin registry - discovers and manages available plugins
pub struct PluginRegistry {
    plugins: Arc<Mutex<Vec<PluginEntry>>>,
    plugin_dirs: Vec<String>,
}

impl PluginRegistry {
    pub fn new() -> Self {
        Self {
            plugins: Arc::new(Mutex::new(Vec::new())),
            plugin_dirs: vec![
                "plugins/backend".to_string(),
                "./plugins/backend".to_string(),
            ],
        }
    }
    
    /// Add plugin directory to search path
    pub fn add_plugin_dir(&mut self, path: &str) {
        self.plugin_dirs.push(path.to_string());
    }
    
    /// Scan plugin directories for available plugins
    pub fn scan(&self) -> Result<Vec<PluginEntry>> {
        let mut entries = Vec::new();
        
        for dir in &self.plugin_dirs {
            if let Ok(dir_entries) = std::fs::read_dir(dir) {
                for entry in dir_entries.flatten() {
                    let path = entry.path();
                    if path.is_dir() {
                        let plugin_json = path.join("plugin.json");
                        if plugin_json.exists() {
                            if let Ok(metadata) = PluginMetadataFile::load_from_file(
                                plugin_json.to_str().unwrap()
                            ) {
                                entries.push(PluginEntry {
                                    id: metadata.name.clone(),
                                    path: path.to_string_lossy().to_string(),
                                    metadata,
                                    enabled: true,
                                });
                            }
                        }
                    }
                }
            }
        }
        
        let mut plugins = self.plugins.lock().unwrap();
        *plugins = entries.clone();
        
        Ok(entries)
    }
    
    /// Get all registered plugins
    pub fn list_plugins(&self) -> Vec<PluginEntry> {
        self.plugins.lock().unwrap().clone()
    }
    
    /// Get plugin by ID
    pub fn get_plugin(&self, id: &str) -> Option<PluginEntry> {
        self.plugins
            .lock()
            .unwrap()
            .iter()
            .find(|p| p.id == id)
            .cloned()
    }
    
    /// Enable/disable a plugin
    pub fn set_enabled(&self, id: &str, enabled: bool) -> Result<()> {
        let mut plugins = self.plugins.lock().unwrap();
        if let Some(plugin) = plugins.iter_mut().find(|p| p.id == id) {
            plugin.enabled = enabled;
            Ok(())
        } else {
            anyhow::bail!("Plugin not found: {}", id)
        }
    }
}

impl Default for PluginRegistry {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_registry() {
        let registry = PluginRegistry::new();
        assert!(registry.list_plugins().is_empty());
    }
}
