#![allow(dead_code)]
// src/core/infrastructure/logging/config.rs
// Logging configuration

use log::LevelFilter;

#[derive(Debug, Clone)]
pub struct LoggingConfig {
    pub level: LevelFilter,
    pub file: String,
    pub console_output: bool,
    pub max_file_size: u64,
    pub max_backups: usize,
}

impl Default for LoggingConfig {
    fn default() -> Self {
        Self {
            level: LevelFilter::Info,
            file: "application.log".to_string(),
            console_output: true,
            max_file_size: 10 * 1024 * 1024, // 10MB
            max_backups: 5,
        }
    }
}

impl LoggingConfig {
    pub fn from_env() -> Self {
        let mut config = Self::default();

        if let Ok(level) = std::env::var("RUST_LOG") {
            config.level = match level.to_lowercase().as_str() {
                "trace" => LevelFilter::Trace,
                "debug" => LevelFilter::Debug,
                "info" => LevelFilter::Info,
                "warn" => LevelFilter::Warn,
                "error" => LevelFilter::Error,
                _ => LevelFilter::Info,
            };
        }

        config
    }

    pub fn level_from_str(level: &str) -> LevelFilter {
        match level.to_lowercase().as_str() {
            "trace" => LevelFilter::Trace,
            "debug" => LevelFilter::Debug,
            "info" => LevelFilter::Info,
            "warn" => LevelFilter::Warn,
            "error" => LevelFilter::Error,
            _ => LevelFilter::Info,
        }
    }
}
