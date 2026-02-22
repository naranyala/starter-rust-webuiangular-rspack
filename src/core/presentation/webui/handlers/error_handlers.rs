// src/core/presentation/webui/handlers/error_handlers.rs
// Error handling WebUI handlers - expose error stats to frontend

use crate::core::error::ErrorCode;
use crate::core::infrastructure::{error_handler, database::Database};
use log::info;
use std::sync::Arc;
use webui_rs::webui;

lazy_static::lazy_static! {
    static ref DB_INSTANCE: std::sync::Mutex<Option<Arc<Database>>> = std::sync::Mutex::new(None);
}

pub fn init_database_monitoring(db: Arc<Database>) {
    let mut instance = DB_INSTANCE.lock().unwrap();
    *instance = Some(db);
    info!("Database monitoring initialized");
}

fn get_db() -> Option<Arc<Database>> {
    let instance = DB_INSTANCE.lock().unwrap();
    instance.clone()
}

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

/// Setup database pool monitoring handlers
pub fn setup_db_monitoring_handlers(window: &mut webui::Window) {
    window.bind("get_db_pool_stats", |_event| {
        info!("get_db_pool_stats called from frontend");
        
        let Some(db) = get_db() else {
            let response = serde_json::json!({
                "error": "Database not initialized"
            });
            let js = format!(
                "window.dispatchEvent(new CustomEvent('db_pool_stats_response', {{ detail: {} }}))",
                response
            );
            webui::Window::from_id(_event.get_window().id).run_js(&js);
            return;
        };
        
        let stats = db.pool_stats();
        let response = serde_json::json!({
            "connections": stats.connections,
            "idle_connections": stats.idle_connections,
            "utilization": stats.utilization(),
        });
        
        let js = format!(
            "window.dispatchEvent(new CustomEvent('db_pool_stats_response', {{ detail: {} }}))",
            response
        );
        webui::Window::from_id(_event.get_window().id).run_js(&js);
    });
    
    info!("Database monitoring handlers set up");
}

/// Setup devtools backend handlers
pub fn setup_devtools_handlers(window: &mut webui::Window) {
    // Get backend statistics
    window.bind("get_backend_stats", |_event| {
        info!("get_backend_stats called from frontend");
        
        // Calculate uptime from application start
        // Note: This is a simplified version - in production you'd track start time
        let response = serde_json::json!({
            "uptime": 0, // Would need a global start time tracker
        });
        
        let js = format!(
            "window.dispatchEvent(new CustomEvent('backend_stats_response', {{ detail: {} }}))",
            response
        );
        webui::Window::from_id(_event.get_window().id).run_js(&js);
    });

    // Get backend logs
    window.bind("get_backend_logs", |event| {
        info!("get_backend_logs called from frontend");
        
        let element_name = unsafe {
            std::ffi::CStr::from_ptr(event.element)
                .to_string_lossy()
                .into_owned()
        };
        
        let limit: usize = element_name.split(':').nth(1).and_then(|s| s.parse().ok()).unwrap_or(20);
        
        // Get recent errors from tracker
        let tracker = error_handler::get_error_tracker();
        let errors = tracker.get_recent(limit);
        
        let logs: Vec<serde_json::Value> = errors.iter().map(|e| {
            serde_json::json!({
                "timestamp": e.timestamp,
                "level": match e.severity {
                    error_handler::ErrorSeverity::Critical | error_handler::ErrorSeverity::Error => "error",
                    error_handler::ErrorSeverity::Warning => "warn",
                    error_handler::ErrorSeverity::Info => "info",
                },
                "source": e.source,
                "message": e.message,
                "context": e.context.iter().cloned().collect::<std::collections::HashMap<_, _>>(),
            })
        }).collect();
        
        let response = serde_json::json!({
            "logs": logs,
            "count": logs.len(),
        });
        
        let js = format!(
            "window.dispatchEvent(new CustomEvent('backend_logs_response', {{ detail: {} }}))",
            response
        );
        webui::Window::from_id(event.get_window().id).run_js(&js);
    });

    // Create test backend error
    window.bind("create_backend_error", |_event| {
        info!("create_backend_error called from frontend - generating test error");
        
        let test_error = error_handler::ErrorEntry::new(
            error_handler::ErrorSeverity::Warning,
            "DEVTOOLS_TEST",
            ErrorCode::ValidationFailed,
            "This is a test error from DevTools".to_string(),
        )
        .with_details("Triggered via DevTools action".to_string());
        
        error_handler::get_error_tracker().record(test_error);
        
        let response = serde_json::json!({
            "success": true,
            "message": "Test error created",
        });
        
        let js = format!(
            "window.dispatchEvent(new CustomEvent('backend_test_error', {{ detail: {} }}))",
            response
        );
        webui::Window::from_id(_event.get_window().id).run_js(&js);
    });
    
    info!("DevTools backend handlers set up");
}
