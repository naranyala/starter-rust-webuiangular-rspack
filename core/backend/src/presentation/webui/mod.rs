// core/backend/src/presentation/webui/mod.rs
//! WebUI Bridge

/// WebUI Bridge for frontend communication
pub struct WebUIBridge;

impl WebUIBridge {
    pub fn new() -> Self {
        Self
    }
    
    pub fn call(&self, _function: &str, _payload: &str) -> Result<String, anyhow::Error> {
        // Placeholder - actual implementation would call WebUI
        Ok("{}".to_string())
    }
}

impl Default for WebUIBridge {
    fn default() -> Self {
        Self::new()
    }
}
