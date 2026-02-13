#![allow(dead_code)]

// lib/logging.rs
// Infrastructure module for logging functionality

use log::{LevelFilter, Metadata, Record};
use std::io::Write;

pub struct Logger;

impl Logger {
    pub fn new() -> Self {
        Self
    }
}

impl log::Log for Logger {
    fn enabled(&self, metadata: &Metadata) -> bool {
        metadata.level() <= log::max_level() && metadata.level() <= log::STATIC_MAX_LEVEL
    }

    fn log(&self, record: &Record) {
        if self.enabled(record.metadata()) {
            let timestamp = chrono::Local::now().format("%Y-%m-%d %H:%M:%S%.3f");
            let level = record.level();
            let target = record.target();
            let message = record.args();

            // Print to console
            println!("[{}] {} [{}] {}", timestamp, level, target, message);

            // Write to log file
            if let Ok(mut file) = std::fs::OpenOptions::new()
                .create(true)
                .append(true)
                .open("application.log")
            {
                writeln!(file, "[{}] {} [{}] {}", timestamp, level, target, message).ok();
            }
        }
    }

    fn flush(&self) {}
}

#[allow(dead_code)]
pub fn init_logging() -> Result<(), Box<dyn std::error::Error>> {
    log::set_boxed_logger(Box::new(Logger::new()))?;

    // Set log level based on environment variable or default to Info
    let level = match std::env::var("RUST_LOG").as_deref() {
        Ok("debug") => LevelFilter::Debug,
        Ok("info") => LevelFilter::Info,
        Ok("warn") => LevelFilter::Warn,
        Ok("error") => LevelFilter::Error,
        _ => LevelFilter::Info,
    };

    log::set_max_level(level);

    Ok(())
}

#[allow(dead_code)]
pub fn init_logging_with_config(
    log_file: Option<&str>,
    log_level: &str,
    _append: bool,
) -> Result<(), Box<dyn std::error::Error>> {
    log::set_boxed_logger(Box::new(Logger::new()))?;

    // Determine log level from config or environment variable
    let level = if let Ok(env_level) = std::env::var("RUST_LOG").as_deref() {
        match env_level {
            "debug" => LevelFilter::Debug,
            "info" => LevelFilter::Info,
            "warn" => LevelFilter::Warn,
            "error" => LevelFilter::Error,
            _ => LevelFilter::Info,
        }
    } else {
        match log_level {
            "debug" => LevelFilter::Debug,
            "info" => LevelFilter::Info,
            "warn" => LevelFilter::Warn,
            "error" => LevelFilter::Error,
            _ => LevelFilter::Info,
        }
    };

    log::set_max_level(level);

    if let Some(file_path) = log_file
        && !file_path.is_empty() {
            println!("Logging to file: {}", file_path);
        }

    Ok(())
}
