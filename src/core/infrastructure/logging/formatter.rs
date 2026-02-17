// src/core/infrastructure/logging/formatter.rs
// Log message formatting

use log::Record;

pub struct LogFormatter;

impl LogFormatter {
    pub fn new() -> Self {
        Self
    }

    pub fn format_json(&self, record: &Record) -> String {
        let level = record.level();
        let target = record.target();
        let message = record.args().to_string();
        let line = record.line().unwrap_or(0);
        let file = record.file().unwrap_or("unknown");

        let escaped_msg = message.replace('\\', "\\\\").replace('"', "\\\"");

        format!(
            r#"{{"level":"{}","target":"{}","file":"{}","line":{},"message":"{}"}}"#,
            level, target, file, line, escaped_msg
        )
    }

    pub fn format_console(&self, record: &Record) -> String {
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
            "{}[{}]{} [{}] {}",
            color, level, reset, target, message
        )
    }
}
