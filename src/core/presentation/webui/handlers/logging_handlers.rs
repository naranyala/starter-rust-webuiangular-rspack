use log::{debug, error, info, warn};
use serde::{Deserialize, Serialize};
use std::ffi::CStr;
use webui_rs::webui::bindgen::webui_interface_get_string_at;

#[derive(Debug, Deserialize, Serialize)]
pub struct FrontendLogEntry {
    pub message: String,
    pub level: String,
    #[serde(default)]
    pub meta: serde_json::Value,
    #[serde(default)]
    pub category: String,
    #[serde(alias = "sessionId")]
    pub session_id: String,
    #[serde(alias = "frontendTimestamp")]
    pub frontend_timestamp: String,
}

fn read_event_payload(event: &webui_rs::webui::Event) -> Option<String> {
    let ptr = unsafe { webui_interface_get_string_at(event.window, event.event_number, 0) };
    if ptr.is_null() {
        return None;
    }
    Some(unsafe { CStr::from_ptr(ptr).to_string_lossy().into_owned() })
}

pub fn setup_logging_handlers(window: &mut webui_rs::webui::Window) {
    window.bind("log_message", |event| {
        let data = match read_event_payload(&event) {
            Some(payload) => payload,
            None => {
                error!("log_message missing payload");
                return;
            }
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
