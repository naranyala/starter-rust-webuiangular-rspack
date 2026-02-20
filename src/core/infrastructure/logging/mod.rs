#![allow(dead_code)]
// src/core/infrastructure/logging/mod.rs
// Logging module - Application logging system

pub mod config;
pub mod formatter;
pub mod logger;

pub use config::LoggingConfig;
pub use logger::Logger;

/// Initialize logging with default configuration
pub fn init_logging() -> Result<(), Box<dyn std::error::Error>> {
    init_logging_with_config(None, "info", false)
}

/// Initialize logging with custom configuration
pub fn init_logging_with_config(
    log_file: Option<&str>,
    log_level: &str,
    _append: bool,
) -> Result<(), Box<dyn std::error::Error>> {
    let file_path = log_file.unwrap_or("logs/application.log");

    let logger = Logger::new()
        .with_file(file_path)
        .with_max_size(10 * 1024 * 1024)
        .with_max_backups(5)
        .with_console_output(true);

    log::set_boxed_logger(Box::new(logger))?;

    let level = LoggingConfig::level_from_str(log_level);
    log::set_max_level(level);

    log::info!(
        "Logging initialized: level={}, file={}",
        std::env::var("RUST_LOG").unwrap_or_else(|_| log_level.to_string()),
        file_path
    );

    Ok(())
}

/// Get default log file path (resolved relative to executable)
pub fn get_log_file_path() -> String {
    Logger::default_log_path()
}
