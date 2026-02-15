// use_cases/handlers/db_handlers.rs
// Database-related API handlers for frontend integration

use crate::infrastructure::database::Database;
use log::info;
use std::sync::{Arc, Mutex};
use webui_rs::webui;

lazy_static::lazy_static! {
    static ref DB_INSTANCE: Mutex<Option<Arc<Database>>> = Mutex::new(None);
}

/// Initialize the database instance
pub fn init_database(db: Arc<Database>) {
    let mut instance = DB_INSTANCE.lock().unwrap();
    *instance = Some(db);
    info!("Database handlers initialized");
}

/// Get the database instance
fn get_db() -> Option<Arc<Database>> {
    let instance = DB_INSTANCE.lock().unwrap();
    instance.clone()
}

/// Helper function to send response to JavaScript
fn send_response(window: webui::Window, event_name: &str, response: &serde_json::Value) {
    let js = format!(
        "window.dispatchEvent(new CustomEvent('{}', {{ detail: {} }}))",
        event_name,
        response
    );
    webui::Window::from_id(window.id).run_js(&js);
}

/// Set up database-related event handlers
pub fn setup_db_handlers(window: &mut webui::Window) {
    window.bind("get_users", |event| {
        info!("get_users called from frontend");
        let window = event.get_window();

        match get_db() {
            Some(db) => match db.get_all_users() {
                Ok(users) => {
                    let response = serde_json::json!({
                        "success": true,
                        "data": users,
                        "count": users.len()
                    });
                    send_response(window, "db_response", &response);
                }
                Err(e) => {
                    info!("Database error getting users: {}", e);
                    let response = serde_json::json!({
                        "success": false,
                        "error": format!("Database error: {}", e)
                    });
                    send_response(window, "db_response", &response);
                }
            },
            None => {
                info!("Database not initialized");
                let response = serde_json::json!({
                    "success": false,
                    "error": "Database not initialized"
                });
                send_response(window, "db_response", &response);
            }
        }
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

        if name.is_empty() || email.is_empty() {
            let response = serde_json::json!({
                "success": false,
                "error": "Name and email are required"
            });
            send_response(window, "user_create_response", &response);
            return;
        }

        match get_db() {
            Some(db) => match db.insert_user(name, email, role, status) {
                Ok(id) => {
                    let response = serde_json::json!({
                        "success": true,
                        "id": id,
                        "message": format!("User '{}' created successfully", name)
                    });
                    send_response(window, "user_create_response", &response);
                }
                Err(e) => {
                    info!("Insert error: {}", e);
                    let response = serde_json::json!({
                        "success": false,
                        "error": format!("Insert error: {}", e)
                    });
                    send_response(window, "user_create_response", &response);
                }
            },
            None => {
                info!("Database not initialized");
                let response = serde_json::json!({
                    "success": false,
                    "error": "Database not initialized"
                });
                send_response(window, "user_create_response", &response);
            }
        }
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

        if id <= 0 {
            let response = serde_json::json!({
                "success": false,
                "error": "Valid user ID is required"
            });
            send_response(window, "user_update_response", &response);
            return;
        }

        match get_db() {
            Some(db) => match db.update_user(id, name, email, role, status) {
                Ok(rows_updated) => {
                    let response = serde_json::json!({
                        "success": true,
                        "rows_updated": rows_updated,
                        "message": format!("User ID {} updated successfully", id)
                    });
                    send_response(window, "user_update_response", &response);
                }
                Err(e) => {
                    info!("Update error: {}", e);
                    let response = serde_json::json!({
                        "success": false,
                        "error": format!("Update error: {}", e)
                    });
                    send_response(window, "user_update_response", &response);
                }
            },
            None => {
                info!("Database not initialized");
                let response = serde_json::json!({
                    "success": false,
                    "error": "Database not initialized"
                });
                send_response(window, "user_update_response", &response);
            }
        }
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

        if id <= 0 {
            let response = serde_json::json!({
                "success": false,
                "error": "Valid user ID is required"
            });
            send_response(window, "user_delete_response", &response);
            return;
        }

        match get_db() {
            Some(db) => match db.delete_user(id) {
                Ok(rows_deleted) => {
                    let response = serde_json::json!({
                        "success": true,
                        "rows_deleted": rows_deleted,
                        "message": format!("User ID {} deleted successfully", id)
                    });
                    send_response(window, "user_delete_response", &response);
                }
                Err(e) => {
                    info!("Delete error: {}", e);
                    let response = serde_json::json!({
                        "success": false,
                        "error": format!("Delete error: {}", e)
                    });
                    send_response(window, "user_delete_response", &response);
                }
            },
            None => {
                info!("Database not initialized");
                let response = serde_json::json!({
                    "success": false,
                    "error": "Database not initialized"
                });
                send_response(window, "user_delete_response", &response);
            }
        }
    });

    window.bind("get_db_stats", |event| {
        info!("get_db_stats called from frontend");
        let window = event.get_window();

        match get_db() {
            Some(db) => {
                let user_count = match db.query("SELECT COUNT(*) as count FROM users", &[]) {
                    Ok(result) => result
                        .data.first()
                        .and_then(|row| row.get("count"))
                        .and_then(|v| v.as_i64())
                        .unwrap_or(0),
                    Err(_) => 0,
                };

                let response = serde_json::json!({
                    "success": true,
                    "stats": {
                        "users": user_count,
                        "tables": ["users", "products"]
                    }
                });
                send_response(window, "stats_response", &response);
            }
            None => {
                info!("Database not initialized");
                let response = serde_json::json!({
                    "success": false,
                    "error": "Database not initialized"
                });
                send_response(window, "stats_response", &response);
            }
        }
    });

    info!("Database handlers set up successfully");
}
