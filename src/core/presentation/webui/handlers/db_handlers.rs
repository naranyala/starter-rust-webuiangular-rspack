use crate::core::error::{AppError, ErrorValue, ErrorCode};
use crate::core::infrastructure::database::Database;
use log::{error, info};
use std::sync::{Arc, Mutex};
use webui_rs::webui;

lazy_static::lazy_static! {
    static ref DB_INSTANCE: Mutex<Option<Arc<Database>>> = Mutex::new(None);
}

pub fn init_database(db: Arc<Database>) {
    let mut instance = DB_INSTANCE.lock().unwrap();
    *instance = Some(db);
    info!("Database handlers initialized");
}

fn get_db() -> Option<Arc<Database>> {
    let instance = DB_INSTANCE.lock().unwrap();
    instance.clone()
}

/// Send a success response to the frontend
fn send_success_response(window: webui::Window, event_name: &str, data: &serde_json::Value) {
    let response = serde_json::json!({
        "success": true,
        "data": data,
        "error": null
    });
    dispatch_event(window, event_name, &response);
}

/// Send an error response to the frontend using structured error values
fn send_error_response(window: webui::Window, event_name: &str, err: &AppError) {
    let error_value = err.to_value();
    let response = serde_json::json!({
        "success": false,
        "data": null,
        "error": error_value.to_response()
    });
    dispatch_event(window, event_name, &response);
}

/// Helper to dispatch a custom event to the frontend
fn dispatch_event(window: webui::Window, event_name: &str, detail: &serde_json::Value) {
    let js = format!(
        "window.dispatchEvent(new CustomEvent('{}', {{ detail: {} }}))",
        event_name, detail
    );
    webui::Window::from_id(window.id).run_js(&js);
}

/// Handle a database operation result and send appropriate response
fn handle_db_result<T: serde::Serialize>(
    window: webui::Window,
    event_name: &str,
    result: Result<T, AppError>,
    success_message: Option<&str>,
) {
    match result {
        Ok(data) => {
            let response_data = if let Some(msg) = success_message {
                serde_json::json!({
                    "message": msg,
                    "payload": data
                })
            } else {
                serde_json::to_value(data).unwrap_or(serde_json::Value::Null)
            };
            send_success_response(window, event_name, &response_data);
        }
        Err(e) => {
            error!("Database operation failed: {}", e);
            send_error_response(window, event_name, &e);
        }
    }
}

pub fn setup_db_handlers(window: &mut webui::Window) {
    window.bind("get_users", |event| {
        info!("get_users called from frontend");
        info!("[Communication] Frontend → Backend (get_users): JSON/FFI call received");
        let window = event.get_window();

        let Some(db) = get_db() else {
            let err = AppError::DependencyInjection(
                ErrorValue::new(ErrorCode::InternalError, "Database not initialized")
                    .with_cause("DI container missing database instance")
            );
            send_error_response(window, "db_response", &err);
            return;
        };

        handle_db_result(
            window,
            "db_response",
            db.get_all_users(),
            Some("Users retrieved successfully"),
        );
    });

    window.bind("create_user", |event| {
        info!("create_user called from frontend");

        let element_name = unsafe {
            std::ffi::CStr::from_ptr(event.element)
                .to_string_lossy()
                .into_owned()
        };

        let window = event.get_window();

        let parts: Vec<&str> = element_name.split(':').collect();
        let name = if parts.len() > 1 { parts[1] } else { "" };
        let email = if parts.len() > 2 { parts[2] } else { "" };
        let role = if parts.len() > 3 { parts[3] } else { "User" };
        let status = if parts.len() > 4 { parts[4] } else { "Active" };

        let Some(db) = get_db() else {
            let err = AppError::DependencyInjection(
                ErrorValue::new(ErrorCode::InternalError, "Database not initialized")
                    .with_cause("DI container missing database instance")
            );
            send_error_response(window, "user_create_response", &err);
            return;
        };

        handle_db_result(
            window,
            "user_create_response",
            db.insert_user(name, email, role, status),
            Some(&format!("User '{}' created successfully", name)),
        );
    });

    window.bind("update_user", |event| {
        info!("update_user called from frontend");

        let element_name = unsafe {
            std::ffi::CStr::from_ptr(event.element)
                .to_string_lossy()
                .into_owned()
        };

        let window = event.get_window();

        let parts: Vec<&str> = element_name.split(':').collect();
        let id: i64 = if parts.len() > 1 {
            parts[1].parse().unwrap_or(0)
        } else {
            0
        };
        let name = if parts.len() > 2 {
            Some(parts[2].to_string())
        } else {
            None
        };
        let email = if parts.len() > 3 {
            Some(parts[3].to_string())
        } else {
            None
        };
        let role = if parts.len() > 4 {
            Some(parts[4].to_string())
        } else {
            None
        };
        let status = if parts.len() > 5 {
            Some(parts[5].to_string())
        } else {
            None
        };

        let Some(db) = get_db() else {
            let err = AppError::DependencyInjection(
                ErrorValue::new(ErrorCode::InternalError, "Database not initialized")
                    .with_cause("DI container missing database instance")
            );
            send_error_response(window, "user_update_response", &err);
            return;
        };

        handle_db_result(
            window,
            "user_update_response",
            db.update_user(id, name, email, role, status),
            Some(&format!("User ID {} updated successfully", id)),
        );
    });

    window.bind("delete_user", |event| {
        info!("delete_user called from frontend");

        let element_name = unsafe {
            std::ffi::CStr::from_ptr(event.element)
                .to_string_lossy()
                .into_owned()
        };

        let window = event.get_window();

        let parts: Vec<&str> = element_name.split(':').collect();
        let id: i64 = if parts.len() > 1 {
            parts[1].parse().unwrap_or(0)
        } else {
            0
        };

        let Some(db) = get_db() else {
            let err = AppError::DependencyInjection(
                ErrorValue::new(ErrorCode::InternalError, "Database not initialized")
                    .with_cause("DI container missing database instance")
            );
            send_error_response(window, "user_delete_response", &err);
            return;
        };

        handle_db_result(
            window,
            "user_delete_response",
            db.delete_user(id),
            Some(&format!("User ID {} deleted successfully", id)),
        );
    });

    info!("Database handlers set up successfully");
}
