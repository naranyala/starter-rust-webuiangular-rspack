// infrastructure/config.rs
// Application configuration module

#![allow(dead_code)]

use serde::Deserialize;
use std::env;
use std::fs;
use std::path::Path;

#[derive(Debug, Deserialize, Clone)]
pub struct AppConfig {
    pub app: AppSettings,
    pub executable: ExecutableSettings,
    pub database: DatabaseSettings,
    pub window: WindowSettings,
    pub logging: LoggingSettings,
    pub communication: CommunicationSettings,
    pub features: FeatureSettings,
}

#[derive(Debug, Deserialize, Clone)]
pub struct AppSettings {
    pub name: String,
    pub version: String,
    pub description: Option<String>,
    pub author: Option<String>,
    pub website: Option<String>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct ExecutableSettings {
    pub name: String,
}

#[derive(Debug, Deserialize, Clone)]
pub struct DatabaseSettings {
    pub path: String,
    pub create_sample_data: Option<bool>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct WindowSettings {
    pub title: String,
    pub width: Option<u32>,
    pub height: Option<u32>,
    pub min_width: Option<u32>,
    pub min_height: Option<u32>,
    pub resizable: Option<bool>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct LoggingSettings {
    pub level: String,
    pub file: String,
    pub append: Option<bool>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct CommunicationSettings {
    pub transport: Option<String>,
    pub serialization: Option<String>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct FeatureSettings {
    pub dark_mode: Option<bool>,
    pub show_tray_icon: Option<bool>,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            app: AppSettings {
                name: String::from("Rust WebUI Application"),
                version: String::from("1.0.0"),
                description: None,
                author: None,
                website: None,
            },
            executable: ExecutableSettings {
                name: String::from("rustwebui-app"),
            },
            database: DatabaseSettings {
                path: String::from("app.db"),
                create_sample_data: Some(true),
            },
            window: WindowSettings {
                title: String::from("Rust WebUI Application"),
                width: Some(1200),
                height: Some(800),
                min_width: Some(800),
                min_height: Some(600),
                resizable: Some(true),
            },
            logging: LoggingSettings {
                level: String::from("info"),
                file: String::from("application.log"),
                append: Some(true),
            },
            communication: CommunicationSettings {
                transport: Some(String::from("webview_ffi")),
                serialization: Some(String::from("json")),
            },
            features: FeatureSettings {
                dark_mode: Some(true),
                show_tray_icon: Some(false),
            },
        }
    }
}

impl AppConfig {
    pub fn load() -> Result<Self, Box<dyn std::error::Error>> {
        // Try to find config file
        let config_paths = [
            "app.config.toml",
            "config/app.config.toml",
            "./app.config.toml",
            "./config/app.config.toml",
        ];

        let mut config_content = None;
        let mut config_path = String::new();

        for path in &config_paths {
            if Path::new(path).exists() {
                config_content = Some(fs::read_to_string(path)?);
                config_path = path.to_string();
                break;
            }
        }

        // Also check APP_CONFIG environment variable
        if config_content.is_none() {
            if let Ok(env_path) = env::var("APP_CONFIG") {
                if Path::new(&env_path).exists() {
                    config_content = Some(fs::read_to_string(&env_path)?);
                    config_path = env_path;
                }
            }
        }

        // Try to parse TOML if config found
        if let Some(content) = config_content {
            match toml::from_str(&content) {
                Ok(config) => {
                    println!("Loaded configuration from: {}", config_path);
                    return Ok(config);
                }
                Err(e) => {
                    eprintln!("Warning: Failed to parse config file: {}", e);
                    eprintln!("Using default configuration");
                }
            }
        }

        // Return default config if no config file found or parsing failed
        Ok(AppConfig::default())
    }

    pub fn get_app_name(&self) -> &str {
        &self.app.name
    }

    pub fn get_version(&self) -> &str {
        &self.app.version
    }

    pub fn get_db_path(&self) -> &str {
        &self.database.path
    }

    pub fn should_create_sample_data(&self) -> bool {
        self.database.create_sample_data.unwrap_or(true)
    }

    pub fn get_window_title(&self) -> &str {
        &self.window.title
    }

    pub fn get_log_level(&self) -> &str {
        &self.logging.level
    }

    pub fn get_log_file(&self) -> &str {
        &self.logging.file
    }

    pub fn is_append_log(&self) -> bool {
        self.logging.append.unwrap_or(true)
    }

    pub fn get_transport(&self) -> &str {
        self.communication.transport.as_deref().unwrap_or("webview_ffi")
    }

    pub fn get_serialization(&self) -> &str {
        self.communication.serialization.as_deref().unwrap_or("json")
    }

    pub fn is_dark_mode(&self) -> bool {
        self.features.dark_mode.unwrap_or(true)
    }

    pub fn get_executable_name(&self) -> &str {
        &self.executable.name
    }

    pub fn get_window_size(&self) -> (u32, u32) {
        (
            self.window.width.unwrap_or(1200),
            self.window.height.unwrap_or(800),
        )
    }

    pub fn get_min_window_size(&self) -> (u32, u32) {
        (
            self.window.min_width.unwrap_or(800),
            self.window.min_height.unwrap_or(600),
        )
    }

    pub fn is_resizable(&self) -> bool {
        self.window.resizable.unwrap_or(true)
    }
}

// Configuration for build-time access
#[derive(Debug)]
#[allow(dead_code)]
pub struct BuildConfig {
    pub package_name: String,
    pub package_version: String,
    pub executable_name: String,
    pub config_file: String,
}

#[allow(dead_code)]
impl BuildConfig {
    pub fn load_from_env() -> Self {
        let package_name =
            env::var("CARGO_PKG_NAME").unwrap_or_else(|_| "rustwebui-app".to_string());
        let package_version = env::var("CARGO_PKG_VERSION").unwrap_or_else(|_| "1.0.0".to_string());

        // Read executable name from config or use default
        let executable_name = match AppConfig::load() {
            Ok(config) => config.get_executable_name().to_string(),
            Err(_) => package_name.clone(),
        };

        let config_file = String::from("app.config.toml");

        Self {
            package_name,
            package_version,
            executable_name,
            config_file,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_config() {
        let config = AppConfig::default();
        assert_eq!(config.app.name, "Rust WebUI Application");
        assert_eq!(config.database.path, "app.db");
        assert_eq!(config.logging.level, "info");
    }

    #[test]
    fn test_config_getters() {
        let config = AppConfig::default();
        assert!(config.should_create_sample_data());
        assert!(config.is_dark_mode());
        assert!(config.is_resizable());
        assert_eq!(config.get_window_size(), (1200, 800));
    }
}
