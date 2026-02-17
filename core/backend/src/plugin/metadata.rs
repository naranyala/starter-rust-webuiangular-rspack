// core/backend/src/plugin/metadata.rs
//! Plugin Metadata
//! 
//! Defines plugin metadata structure.

use serde::{Deserialize, Serialize};

/// Plugin metadata from plugin.json
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PluginMetadataFile {
    pub name: String,
    pub version: String,
    pub description: String,
    #[serde(default)]
    pub author: Option<String>,
    #[serde(default)]
    pub dependencies: Vec<String>,
    #[serde(default)]
    pub core_version: String,
}

impl PluginMetadataFile {
    pub fn load_from_str(json: &str) -> Result<Self, serde_json::Error> {
        serde_json::from_str(json)
    }
    
    pub fn load_from_file(path: &str) -> Result<Self, Box<dyn std::error::Error>> {
        let content = std::fs::read_to_string(path)?;
        Ok(serde_json::from_str(&content)?)
    }
}
