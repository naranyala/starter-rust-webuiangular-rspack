// src/application/events.rs
// Event definitions for the Rust Event Bus

use serde::{Deserialize, Serialize};

pub trait AppEvent: Clone + Send + Sync + 'static {
    fn event_type(&self) -> &'static str;
    fn timestamp(&self) -> i64;
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct AppReadyEvent {
    pub version: String,
    pub timestamp: i64,
}

impl AppEvent for AppReadyEvent {
    fn event_type(&self) -> &'static str {
        "app:ready"
    }

    fn timestamp(&self) -> i64 {
        self.timestamp
    }
}

impl AppReadyEvent {
    pub fn new(version: impl Into<String>) -> Self {
        Self {
            version: version.into(),
            timestamp: chrono::Utc::now().timestamp_millis(),
        }
    }
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct BuildEvent {
    pub target: String,
    pub step: Option<String>,
    pub status: BuildStatus,
    pub message: String,
    pub duration_ms: Option<u64>,
    pub timestamp: i64,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub enum BuildStatus {
    Started,
    InProgress,
    Completed,
    Failed,
    Warning,
}

impl AppEvent for BuildEvent {
    fn event_type(&self) -> &'static str {
        "build:event"
    }

    fn timestamp(&self) -> i64 {
        self.timestamp
    }
}

impl BuildEvent {
    pub fn started(target: impl Into<String>) -> Self {
        Self {
            target: target.into(),
            step: None,
            status: BuildStatus::Started,
            message: "Build started".to_string(),
            duration_ms: None,
            timestamp: chrono::Utc::now().timestamp_millis(),
        }
    }

    pub fn step_start(target: impl Into<String>, step: impl Into<String>) -> Self {
        Self {
            target: target.into(),
            step: Some(step.into()),
            status: BuildStatus::InProgress,
            message: "Step started".to_string(),
            duration_ms: None,
            timestamp: chrono::Utc::now().timestamp_millis(),
        }
    }

    pub fn step_complete(
        target: impl Into<String>,
        step: impl Into<String>,
        duration_ms: u64,
    ) -> Self {
        Self {
            target: target.into(),
            step: Some(step.into()),
            status: BuildStatus::Completed,
            message: "Step completed".to_string(),
            duration_ms: Some(duration_ms),
            timestamp: chrono::Utc::now().timestamp_millis(),
        }
    }

    pub fn step_failed(
        target: impl Into<String>,
        step: impl Into<String>,
        error: impl Into<String>,
    ) -> Self {
        Self {
            target: target.into(),
            step: Some(step.into()),
            status: BuildStatus::Failed,
            message: error.into(),
            duration_ms: None,
            timestamp: chrono::Utc::now().timestamp_millis(),
        }
    }

    pub fn complete(target: impl Into<String>, success: bool, total_duration_ms: u64) -> Self {
        Self {
            target: target.into(),
            step: None,
            status: if success {
                BuildStatus::Completed
            } else {
                BuildStatus::Failed
            },
            message: if success {
                "Build completed successfully"
            } else {
                "Build failed"
            }
            .to_string(),
            duration_ms: Some(total_duration_ms),
            timestamp: chrono::Utc::now().timestamp_millis(),
        }
    }
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct WindowEvent {
    pub event_type: WindowEventType,
    pub width: Option<u32>,
    pub height: Option<u32>,
    pub timestamp: i64,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub enum WindowEventType {
    Resized,
    Fullscreen,
    Focus,
    Blur,
    Close,
}

impl AppEvent for WindowEvent {
    fn event_type(&self) -> &'static str {
        "window:event"
    }

    fn timestamp(&self) -> i64 {
        self.timestamp
    }
}

impl WindowEvent {
    pub fn resized(width: u32, height: u32) -> Self {
        Self {
            event_type: WindowEventType::Resized,
            width: Some(width),
            height: Some(height),
            timestamp: chrono::Utc::now().timestamp_millis(),
        }
    }

    pub fn fullscreen(enabled: bool) -> Self {
        Self {
            event_type: WindowEventType::Fullscreen,
            width: None,
            height: None,
            timestamp: chrono::Utc::now().timestamp_millis(),
        }
    }

    pub fn focus() -> Self {
        Self {
            event_type: WindowEventType::Focus,
            width: None,
            height: None,
            timestamp: chrono::Utc::now().timestamp_millis(),
        }
    }

    pub fn blur() -> Self {
        Self {
            event_type: WindowEventType::Blur,
            width: None,
            height: None,
            timestamp: chrono::Utc::now().timestamp_millis(),
        }
    }
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct LogEvent {
    pub level: String,
    pub message: String,
    pub target: Option<String>,
    pub timestamp: i64,
}

impl AppEvent for LogEvent {
    fn event_type(&self) -> &'static str {
        "log:event"
    }

    fn timestamp(&self) -> i64 {
        self.timestamp
    }
}

impl LogEvent {
    pub fn info(message: impl Into<String>, target: Option<impl Into<String>>) -> Self {
        Self {
            level: "info".to_string(),
            message: message.into(),
            target: target.map(|t| t.into()),
            timestamp: chrono::Utc::now().timestamp_millis(),
        }
    }

    pub fn warn(message: impl Into<String>, target: Option<impl Into<String>>) -> Self {
        Self {
            level: "warn".to_string(),
            message: message.into(),
            target: target.map(|t| t.into()),
            timestamp: chrono::Utc::now().timestamp_millis(),
        }
    }

    pub fn error(message: impl Into<String>, target: Option<impl Into<String>>) -> Self {
        Self {
            level: "error".to_string(),
            message: message.into(),
            target: target.map(|t| t.into()),
            timestamp: chrono::Utc::now().timestamp_millis(),
        }
    }
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct FrontendEvent {
    pub event_type: String,
    pub data: serde_json::Value,
    pub session_id: Option<String>,
    pub timestamp: i64,
}

impl AppEvent for FrontendEvent {
    fn event_type(&self) -> &'static str {
        "frontend:event"
    }

    fn timestamp(&self) -> i64 {
        self.timestamp
    }
}

impl FrontendEvent {
    pub fn new(event_type: impl Into<String>, data: serde_json::Value) -> Self {
        Self {
            event_type: event_type.into(),
            data,
            session_id: None,
            timestamp: chrono::Utc::now().timestamp_millis(),
        }
    }

    pub fn with_session(mut self, session_id: impl Into<String>) -> Self {
        self.session_id = Some(session_id.into());
        self
    }
}
