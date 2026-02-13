use crate::infrastructure::database::Database;
use log::info;
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

fn send_response(window: webui::Window, event_name: &str, response: &serde_json::Value) {
    let js = format!(
        "window.dispatchEvent(new CustomEvent('{}', {{ detail: {} }}))",
        event_name, response
    );
    webui::Window::from_id(window.id).run_js(&js);
}

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

    info!("Database handlers set up successfully");
}
