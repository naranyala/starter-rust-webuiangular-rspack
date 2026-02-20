use crate::core::infrastructure::event_bus::{EventData, GLOBAL_EVENT_BUS};
use log::info;
use serde::{Deserialize, Serialize};
use std::ffi::CStr;
use webui_rs::webui::bindgen::webui_interface_get_string_at;

#[derive(Debug, Serialize, Deserialize)]
pub struct EventPublishRequest {
    pub event_type: String,
    pub data: serde_json::Value,
    pub source: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct EventHistoryRequest {
    pub event_type: Option<String>,
    pub limit: Option<usize>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct EventHistoryResponse {
    pub events: Vec<serde_json::Value>,
    pub count: usize,
}

fn read_event_payload(event: &webui_rs::webui::Event) -> Option<String> {
    let ptr = unsafe { webui_interface_get_string_at(event.window, event.event_number, 0) };
    if ptr.is_null() {
        return None;
    }
    Some(unsafe { CStr::from_ptr(ptr).to_string_lossy().into_owned() })
}

fn send_response(window: webui_rs::webui::Window, response: &str) {
    let js = format!(
        "window.dispatchEvent(new CustomEvent('event_response', {{ detail: {} }}))",
        response
    );
    let _ = window.run_js(&js);
}

pub fn setup_event_bus_handlers(window: &mut webui_rs::webui::Window) {
    window.bind("event:publish", move |event| {
        let data = match read_event_payload(&event) {
            Some(payload) => payload,
            None => {
                log::error!("event:publish missing payload");
                return;
            }
        };

        log::info!("[Communication] Frontend → Backend (event:publish): JSON payload received");

        match serde_json::from_str::<EventPublishRequest>(&data) {
            Ok(req) => {
                let frontend_event = EventData::new(req.event_type.clone(), req.data)
                    .with_source(req.source.unwrap_or_else(|| "frontend".to_string()));

                GLOBAL_EVENT_BUS.emit_with_source(
                    &frontend_event.event_type,
                    frontend_event.payload,
                    frontend_event.source.as_deref().unwrap_or("frontend"),
                );

                let response = serde_json::json!({
                    "success": true,
                    "event_type": req.event_type,
                });

                if let Ok(json) = serde_json::to_string(&response) {
                    log::info!("[Communication] Backend → Frontend: JSON response sent");
                    send_response(webui_rs::webui::Window::from_id(event.window), &json);
                }
            }
            Err(e) => {
                log::error!("Failed to parse event publish request: {}", e);
            }
        }
    });

    window.bind("event:history", move |event| {
        let data = match read_event_payload(&event) {
            Some(payload) => payload,
            None => {
                log::error!("event:history missing payload");
                return;
            }
        };

        let req: EventHistoryRequest = serde_json::from_str(&data).unwrap_or(EventHistoryRequest {
            event_type: None,
            limit: Some(50),
        });

        let history = match GLOBAL_EVENT_BUS.get_history(req.event_type.as_deref(), req.limit) {
            Ok(h) => h,
            Err(e) => {
                log::error!("Failed to get event history: {}", e);
                return;
            }
        };

        let events: Vec<serde_json::Value> = history
            .iter()
            .map(|e| {
                serde_json::json!({
                    "event_type": e.event_type,
                    "payload": e.payload,
                    "timestamp": e.timestamp,
                    "source": e.source
                })
            })
            .collect();

        let response = EventHistoryResponse {
            events,
            count: history.len(),
        };

        if let Ok(json) = serde_json::to_string(&response) {
            send_response(webui_rs::webui::Window::from_id(event.window), &json);
        }
    });

    window.bind("event:stats", move |event| {
        let stats = GLOBAL_EVENT_BUS.get_stats();

        if let Ok(json) = serde_json::to_string(&stats) {
            send_response(webui_rs::webui::Window::from_id(event.window), &json);
        }
    });

    window.bind("event:clear_history", move |_event| {
        if let Err(e) = GLOBAL_EVENT_BUS.clear_history() {
            log::error!("Failed to clear event history: {}", e);
        }
    });

    info!("Event bus handlers initialized");
}
