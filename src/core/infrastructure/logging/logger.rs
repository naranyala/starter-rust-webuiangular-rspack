// src/core/infrastructure/logging/logger.rs
// Logger implementation

use log::{LevelFilter, Metadata, Record};
use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::{Path, PathBuf};
use std::sync::Mutex;

use super::formatter::LogFormatter;

pub struct Logger {
    file_path: Mutex<PathBuf>,
    max_file_size: u64,
    max_backup_files: usize,
    log_to_console: bool,
    formatter: LogFormatter,
}

impl Logger {
    pub fn new() -> Self {
        Self {
            file_path: Mutex::new(Self::resolve_log_path("application.log")),
            max_file_size: 10 * 1024 * 1024,
            max_backup_files: 5,
            log_to_console: true,
            formatter: LogFormatter::new(),
        }
    }

    /// Resolve log file path relative to executable or use absolute path
    fn resolve_log_path(log_file: &str) -> PathBuf {
        // If absolute path, use as-is
        if Path::new(log_file).is_absolute() {
            return PathBuf::from(log_file);
        }

        // Try to get executable directory
        if let Ok(exe_path) = std::env::current_exe() {
            if let Some(exe_dir) = exe_path.parent() {
                let log_path = exe_dir.join(log_file);
                
                // Ensure parent directory exists
                if let Some(parent) = log_path.parent() {
                    let _ = fs::create_dir_all(parent);
                }
                
                return log_path;
            }
        }

        // Fallback to current directory
        PathBuf::from(log_file)
    }

    /// Get default log file path
    pub fn default_log_path() -> String {
        Self::resolve_log_path("logs/application.log").to_string_lossy().to_string()
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
}

impl log::Log for Logger {
    fn enabled(&self, metadata: &Metadata) -> bool {
        metadata.level() <= log::max_level() && metadata.level() <= log::STATIC_MAX_LEVEL
    }

    fn log(&self, record: &Record) {
        if self.enabled(record.metadata()) {
            let json_msg = self.formatter.format_json(record);

            if self.log_to_console {
                let console_msg = self.formatter.format_console(record);
                println!("{}", console_msg);
            }

            self.write_to_file(&json_msg);
        }
    }

    fn flush(&self) {}
}
