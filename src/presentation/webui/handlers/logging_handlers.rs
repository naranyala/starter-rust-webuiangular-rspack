use log::{debug, error, info, warn};
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize)]
pub struct FrontendLogEntry {
    pub message: String,
    pub level: String,
    pub meta: serde_json::Value,
    pub category: String,
    pub session_id: String,
    pub frontend_timestamp: String,
}

pub fn setup_logging_handlers(window: &mut webui_rs::webui::Window) {
    window.bind("log_message", |event| {
        let data = unsafe {
            std::ffi::CStr::from_ptr(event.element)
                .to_string_lossy()
                .into_owned()
        };

        match serde_json::from_str::<FrontendLogEntry>(&data) {
            Ok(entry) => {
                let target = format!("frontend::{}", entry.category);
                let msg = format!("Session {}: {}", entry.session_id, entry.message);

                match entry.level.to_uppercase().as_str() {
                    "ERROR" => {
                        error!("{}", msg);
                        debug!("Frontend metadata: {:?}", entry.meta);
                    }
                    "WARN" => {
                        warn!("{}", msg);
                    }
                    "DEBUG" => {
                        debug!("{}", msg);
                    }
                    "TRACE" => {
                        debug!("TRACE {}", msg);
                    }
                    _ => {
                        info!("{}", msg);
                    }
                }
            }
            Err(e) => {
                error!("Failed to parse frontend log entry: {}", e);
            }
        }
    });

    window.bind("get_backend_logs", |_event| {
        info!("Frontend requested backend logs");
    });

    info!("Logging handlers initialized");
}
