// core/backend/src/infrastructure/config/mod.rs
//! Configuration

use serde::{Deserialize, Serialize};

/// Application configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub app: AppSettings,
    pub logging: LoggingSettings,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    pub name: String,
    pub version: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoggingSettings {
    pub level: String,
    pub file: String,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            app: AppSettings {
                name: "Rust WebUI App".to_string(),
                version: "1.0.0".to_string(),
            },
            logging: LoggingSettings {
                level: "info".to_string(),
                file: "application.log".to_string(),
            },
        }
    }
}
