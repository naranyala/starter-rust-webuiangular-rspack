#![allow(dead_code)]

use chrono::{Datelike, Local};
use log::{LevelFilter, Metadata, Record};
use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::PathBuf;
use std::sync::Mutex;

pub struct Logger {
    file_path: Mutex<PathBuf>,
    max_file_size: u64,
    max_backup_files: usize,
    log_to_console: bool,
}

impl Logger {
    pub fn new() -> Self {
        Self {
            file_path: Mutex::new(PathBuf::from("application.log")),
            max_file_size: 10 * 1024 * 1024,
            max_backup_files: 5,
            log_to_console: true,
        }
    }

    pub fn with_file(mut self, path: &str) -> Self {
        *self.file_path.lock().unwrap() = PathBuf::from(path);
        self
    }

    pub fn with_max_size(mut self, size: u64) -> Self {
        self.max_file_size = size;
        self
    }

    pub fn with_max_backups(mut self, backups: usize) -> Self {
        self.max_backup_files = backups;
        self
    }

    pub fn with_console_output(mut self, enabled: bool) -> Self {
        self.log_to_console = enabled;
        self
    }

    fn rotate_if_needed(&self) {
        let path = self.file_path.lock().unwrap();
        if let Ok(metadata) = fs::metadata(&*path) {
            if metadata.len() > self.max_file_size {
                drop(metadata);
                let path_str = path.to_string_lossy().to_string();

                for i in (1..self.max_backup_files).rev() {
                    let old_path = format!("{}.{}", path_str, i);
                    let new_path = format!("{}.{}", path_str, i + 1);
                    let _ = fs::remove_file(&new_path);
                    if PathBuf::from(&old_path).exists() {
                        let _ = fs::rename(&old_path, &new_path);
                    }
                }

                let backup_path = format!("{}.1", path_str);
                let _ = fs::rename(&*path, &backup_path);
            }
        }
    }

    fn write_to_file(&self, message: &str) {
        self.rotate_if_needed();

        if let Ok(mut file) = OpenOptions::new()
            .create(true)
            .append(true)
            .open(self.file_path.lock().unwrap().as_path())
        {
            let _ = writeln!(file, "{}", message);
            let _ = file.flush();
        }
    }

    fn format_message(&self, record: &Record) -> String {
        let timestamp = Local::now().format("%Y-%m-%d %H:%M:%S%.3f");
        let level = record.level();
        let target = record.target();
        let message = record.args().to_string();
        let line = record.line().unwrap_or(0);
        let file = record.file().unwrap_or("unknown");

        let escaped_msg = message.replace('\\', "\\\\").replace('"', "\\\"");

        format!(
            r#"{{"timestamp":"{}","level":"{}","target":"{}","file":"{}","line":{},"message":"{}"}}"#,
            timestamp, level, target, file, line, escaped_msg
        )
    }

    fn format_console(&self, record: &Record) -> String {
        let timestamp = Local::now().format("%Y-%m-%d %H:%M:%S%.3f");
        let level = record.level();
        let target = record.target();
        let message = record.args().to_string();

        let color = match level {
            log::Level::Error => "\x1b[31m",
            log::Level::Warn => "\x1b[33m",
            log::Level::Info => "\x1b[32m",
            log::Level::Debug => "\x1b[36m",
            log::Level::Trace => "\x1b[90m",
        };
        let reset = "\x1b[0m";

        format!(
            "{}[{}]{} {}{}{} [{}] {}",
            color, timestamp, reset, color, level, reset, target, message
        )
    }
}

impl log::Log for Logger {
    fn enabled(&self, metadata: &Metadata) -> bool {
        metadata.level() <= log::max_level() && metadata.level() <= log::STATIC_MAX_LEVEL
    }

    fn log(&self, record: &Record) {
        if self.enabled(record.metadata()) {
            let json_msg = self.format_message(record);

            if self.log_to_console {
                let console_msg = self.format_console(record);
                println!("{}", console_msg);
            }

            self.write_to_file(&json_msg);
        }
    }

    fn flush(&self) {}
}

#[allow(dead_code)]
pub fn init_logging() -> Result<(), Box<dyn std::error::Error>> {
    init_logging_with_config(None, "info", false)
}

#[allow(dead_code)]
pub fn init_logging_with_config(
    log_file: Option<&str>,
    log_level: &str,
    _append: bool,
) -> Result<(), Box<dyn std::error::Error>> {
    let file_path = log_file.unwrap_or("application.log");

    let logger = Logger::new()
        .with_file(file_path)
        .with_max_size(10 * 1024 * 1024)
        .with_max_backups(5)
        .with_console_output(true);

    log::set_boxed_logger(Box::new(logger))?;

    let level = if let Ok(env_level) = std::env::var("RUST_LOG").as_deref() {
        match env_level.to_lowercase().as_str() {
            "trace" => LevelFilter::Trace,
            "debug" => LevelFilter::Debug,
            "info" => LevelFilter::Info,
            "warn" => LevelFilter::Warn,
            "error" => LevelFilter::Error,
            _ => LevelFilter::Info,
        }
    } else {
        match log_level.to_lowercase().as_str() {
            "trace" => LevelFilter::Trace,
            "debug" => LevelFilter::Debug,
            "info" => LevelFilter::Info,
            "warn" => LevelFilter::Warn,
            "error" => LevelFilter::Error,
            _ => LevelFilter::Info,
        }
    };

    log::set_max_level(level);

    log::info!(
        "Logging initialized: level={}, file={}",
        if let Ok(l) = std::env::var("RUST_LOG") {
            l
        } else {
            log_level.to_string()
        },
        file_path
    );

    Ok(())
}

#[allow(dead_code)]
pub fn get_log_file_path() -> String {
    "application.log".to_string()
}
