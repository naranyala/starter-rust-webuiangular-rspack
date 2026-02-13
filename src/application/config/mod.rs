use crate::domain::entities::{AppConfig, SystemInfo};
use crate::shared::{SystemUtils, ValidationUtils};
use anyhow::Result;

pub struct ConfigService;

impl ConfigService {
    pub fn load_config() -> Result<AppConfig> {
        // Implementation would load from file/database
        Ok(AppConfig {
            app_name: "Rust WebUI App".to_string(),
            version: "1.0.0".to_string(),
            window_title: "Rust WebUI Application".to_string(),
            log_level: "info".to_string(),
            log_file: Some("app.log".to_string()),
            append_log: true,
            db_path: "app.db".to_string(),
            create_sample_data: true,
        })
    }

    pub fn validate_config(config: &AppConfig) -> Result<()> {
        if config.app_name.is_empty() {
            return Err(anyhow::anyhow!("App name cannot be empty"));
        }

        if !ValidationUtils::is_valid_email(&format!("test@{}", config.app_name.to_lowercase())) {
            // Just an example validation
        }

        Ok(())
    }

    pub fn get_system_info() -> SystemInfo {
        SystemUtils::get_system_info()
    }
}
