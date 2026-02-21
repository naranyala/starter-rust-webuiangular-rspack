// src/core/presentation/webui/handlers/error_handlers.rs
// Error handling WebUI handlers - expose error stats to frontend

use crate::core::infrastructure::error_handler;
use log::info;
use webui_rs::webui;

pub fn setup_error_handlers(window: &mut webui::Window) {
    // Get error statistics
    window.bind("get_error_stats", |_event| {
        info!("get_error_stats called from frontend");
        let tracker = error_handler::get_error_tracker();
        let summary = tracker.get_summary();
        
        let response = serde_json::json!({
            "total": summary.total,
            "errors": summary.errors,
            "warnings": summary.warnings,
            "critical": summary.critical,
        });
        
        let js = format!(
            "window.dispatchEvent(new CustomEvent('error_stats_response', {{ detail: {} }}))",
            response
        );
        webui::Window::from_id(_event.get_window().id).run_js(&js);
    });

    // Get recent errors
    window.bind("get_recent_errors", |event| {
        info!("get_recent_errors called from frontend");
        
        let element_name = unsafe {
            std::ffi::CStr::from_ptr(event.element)
                .to_string_lossy()
                .into_owned()
        };
        
        let limit: usize = element_name.split(':').nth(1).and_then(|s| s.parse().ok()).unwrap_or(10);
        
        let tracker = error_handler::get_error_tracker();
        let errors = tracker.get_recent(limit);
        
        let errors_json: Vec<serde_json::Value> = errors.iter().map(|e| {
            serde_json::json!({
                "id": e.id,
                "timestamp": e.timestamp,
                "severity": format!("{:?}", e.severity),
                "source": e.source,
                "code": format!("{:?}", e.code),
                "message": e.message,
                "details": e.details,
                "context": e.context.iter().cloned().collect::<std::collections::HashMap<_, _>>(),
            })
        }).collect();
        
        let response = serde_json::json!({
            "errors": errors_json,
            "count": errors.len(),
        });
        
        let js = format!(
            "window.dispatchEvent(new CustomEvent('recent_errors_response', {{ detail: {} }}))",
            response
        );
        webui::Window::from_id(event.get_window().id).run_js(&js);
    });

    // Clear error history
    window.bind("clear_error_history", |_event| {
        info!("clear_error_history called from frontend");
        let tracker = error_handler::get_error_tracker();
        tracker.clear();
        
        let response = serde_json::json!({
            "success": true,
            "message": "Error history cleared",
        });
        
        let js = format!(
            "window.dispatchEvent(new CustomEvent('error_history_cleared', {{ detail: {} }}))",
            response
        );
        webui::Window::from_id(_event.get_window().id).run_js(&js);
    });

    info!("Error handlers set up successfully");
}
