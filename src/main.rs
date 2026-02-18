use log::{error, info, warn};
use std::sync::Arc;
use std::net::TcpListener;
use std::fs;
use std::path::PathBuf;
use webui_rs::webui;
use webui_rs::webui::bindgen::webui_set_port;

// MVVM: Core - Domain, Application, Infrastructure, Presentation
mod core;
use core::{
    infrastructure::{config::AppConfig, database::Database, logging, di},
    presentation,
};

// Shared utilities
mod utils;
use utils::compression::CompressionUtils;
use utils::crypto::{CryptoUtils, PasswordUtils};
use utils::encoding::EncodingUtils;
use utils::network::NetworkUtils;
use utils::security::SecurityUtils;
use utils::system::SystemUtils;
use utils::validation::ValidationUtils;

include!(concat!(env!("OUT_DIR"), "/embedded_frontend.rs"));

#[allow(unused_variables)]
fn main() {
    // Initialize dependency injection container
    di::init_container();
    info!("Dependency injection container initialized");

    let container = di::get_container();

    // Load application configuration
    let config = match AppConfig::load() {
        Ok(config) => {
            println!("Configuration loaded successfully!");
            println!(
                "Application: {} v{}",
                config.get_app_name(),
                config.get_version()
            );
            config
        }
        Err(e) => {
            eprintln!("Failed to load configuration: {}", e);
            eprintln!("Using default configuration");
            AppConfig::default()
        }
    };

    // Register configuration in the container
    container.register_singleton(config.clone());

    // Initialize logging system with config settings
    if let Err(e) = logging::init_logging_with_config(
        Some(config.get_log_file()),
        config.get_log_level(),
        config.is_append_log(),
    ) {
        eprintln!("Failed to initialize logger: {}", e);
        return;
    }

    info!("=============================================");
    info!(
        "Starting: {} v{}",
        config.get_app_name(),
        config.get_version()
    );
    info!("=============================================");

    // Display backend-frontend communication configuration
    info!("Backend-Frontend Communication Configuration:");
    info!("  ═══════════════════════════════════════════");
    info!("  TRANSPORT OPTIONS:");
    info!("  ┌─────────────────────────────────────────┐");
    info!("  │ ✓ WebView FFI (Native Binding) [ACTIVE] │");
    info!("  │   HTTP/REST (Not used)                  │");
    info!("  │   WebSocket Emulation (UI display)      │");
    info!("  └─────────────────────────────────────────┘");
    info!("  SERIALIZATION OPTIONS:");
    info!("  ┌────────────────────────────────────────────────────┐");
    info!("  │ Format       │ Size    │ Speed   │ Readable      │");
    info!("  ├────────────────────────────────────────────────────┤");
    info!("  │ ✓ JSON       │ 1.0x    │ 1.0x    │ Yes [ACTIVE]  │");
    info!("  │   MessagePack│ ~0.7x   │ ~1.5x   │ No (Binary)   │");
    info!("  │   CBOR       │ ~0.6x   │ ~1.6x   │ No (Binary)   │");
    info!("  └────────────────────────────────────────────────────┘");
    info!("  SELECTED CONFIGURATION:");
    info!("    Transport: WebView FFI (Native Binding)");
    info!("    Serialization: JSON (serde_json)");
    info!("    UI Status Display: WebSocket (emulated)");
    info!("  ALTERNATIVE FORMATS AVAILABLE:");
    info!("    - MessagePack: 30% smaller, 1.5x faster (binary)");
    info!("    - CBOR: 40% smaller, 1.6x faster (RFC 7049)");
    info!("  COMMUNICATION FLOW:");
    info!("    Frontend JS --[JSON]--> window.bind() --> Rust Backend");
    info!("    Rust Backend --[JSON]--> window.run_js() --> Frontend JS");
    info!("  ═══════════════════════════════════════════");

    info!("Application starting...");

    // Get database path from config
    let db_path = config.get_db_path();
    info!("Database path: {}", db_path);

    // Initialize SQLite database
    let db = match Database::new(db_path) {
        Ok(db) => {
            info!("Database initialized successfully");
            if let Err(e) = db.init() {
                eprintln!("Failed to initialize database schema: {}", e);
                return;
            }
            if config.should_create_sample_data() {
                if let Err(e) = db.insert_sample_data() {
                    eprintln!("Failed to insert sample data: {}", e);
                    return;
                }
                info!("Sample data created (if not exists)");
            }
            Arc::new(db)
        }
        Err(e) => {
            eprintln!("Failed to initialize database: {}", e);
            return;
        }
    };

    // Register database in the container
    container.register_singleton(Arc::clone(&db));

    // Initialize database handlers with the database instance
    presentation::db_handlers::init_database(Arc::clone(&db));

    // Demonstrate utility usage
    info!("=== Utility Modules Demonstration ===");

    // System utilities
    let sys_info = SystemUtils::get_system_info();
    info!("OS: {} {}", sys_info.os_name, sys_info.os_version);
    info!("Hostname: {}", sys_info.hostname);
    info!("CPU Cores: {}", sys_info.cpu_cores);

    // File utilities
    let home_dir = SystemUtils::get_home_dir();
    if let Some(home) = home_dir {
        info!("Home directory: {}", home.display());
    }

    // DateTime utilities
    let now = chrono::Utc::now();
    info!("Current time: {}", now.format("%Y-%m-%d %H:%M:%S UTC"));

    // Crypto utilities
    let test_hash = CryptoUtils::sha256("test_data");
    info!("SHA256 hash: {}", test_hash);

    let password = "MySecurePassword123!";
    let _hashed = PasswordUtils::hash_password(password).unwrap();
    info!("Password hashed successfully");

    // Validation utilities
    let email = "test@example.com";
    let email_valid = ValidationUtils::is_valid_email(email);
    info!("Email '{}' valid: {}", email, email_valid);

    // Encoding utilities
    let original = "Hello, World!";
    let encoded = EncodingUtils::encode_base64(original.as_bytes());
    info!("Base64 encoded: {}", encoded);

    // Network utilities
    let local_ip = NetworkUtils::get_local_ip();
    info!("Local IP: {:?}", local_ip);

    // Process utilities
    info!("Current PID: {}", std::process::id());

    // Compression utilities
    let test_data = b"Test compression data for demonstration purposes.";
    let compressed = CompressionUtils::compress_gzip(test_data).unwrap();
    info!("Gzip compression: {} -> {} bytes", test_data.len(), compressed.len());

    // Security utilities
    let is_admin = SecurityUtils::check_admin();
    info!("Running as admin: {}", is_admin);

    // Create a new window
    let mut my_window = webui::Window::new();

    // Randomize WebUI server port
    let port = TcpListener::bind("127.0.0.1:0")
        .ok()
        .and_then(|listener| listener.local_addr().ok())
        .map(|addr| addr.port());

    let port_ok = port
        .map(|p| unsafe { webui_set_port(my_window.id, p as usize) })
        .unwrap_or(false);

    if port_ok {
        info!("WebUI port set to {}", port.unwrap_or(0));
    } else {
        info!("WebUI port not set, using default");
    }

    // Set up UI event handlers from views layer
    presentation::ui_handlers::setup_ui_handlers(&mut my_window);
    presentation::ui_handlers::setup_counter_handlers(&mut my_window);
    presentation::db_handlers::setup_db_handlers(&mut my_window);
    presentation::sysinfo_handlers::setup_sysinfo_handlers(&mut my_window);
    presentation::logging_handlers::setup_logging_handlers(&mut my_window);
    presentation::event_bus_handlers::setup_event_bus_handlers(&mut my_window);
    presentation::window_state_handler::setup_window_state_handlers(&mut my_window);

    // Get window settings from config
    let window_title = config.get_window_title();
    info!("Window title: {}", window_title);

    // Show the built application - resolve dist/ robustly for both `cargo run` and packaged binaries
    let (dist_dir, index_path) = match resolve_frontend_dist() {
        Some(paths) => paths,
        None => {
            error!("Could not locate frontend dist/index.html");
            error!("Run `./run.sh --build-frontend` and ensure dist/index.html exists.");
            return;
        }
    };
    
    // Set root folder for WebUI to serve static files
    let root_folder = dist_dir.to_str().unwrap_or("dist");
    info!("Setting WebUI root folder to: {}", root_folder);
    let c_string = std::ffi::CString::new(root_folder).unwrap();
    unsafe {
        webui_rs::webui::bindgen::webui_set_root_folder(my_window.id, c_string.as_ptr());
    }
    
    info!("Loading application UI from {}", index_path.display());
    // When root folder is set, WebUI should load by route, not absolute file path.
    my_window.show("index.html");

    // Sync WebUI port to frontend
    if port_ok {
        if let Some(port) = port {
            let js = format!(
                "window.__WEBUI_PORT = {}; window.dispatchEvent(new CustomEvent('webui:port', {{ detail: {{ port: {} }} }}));",
                port, port
            );
            my_window.run_js(js);
        }
    }

    info!("Application started successfully, waiting for events...");
    info!("=============================================");

    // Wait until all windows are closed
    webui::wait();

    info!("Application shutting down...");
    info!("=============================================");
}

fn resolve_frontend_dist() -> Option<(PathBuf, PathBuf)> {
    let mut candidates: Vec<PathBuf> = Vec::new();

    if let Ok(custom_dist) = std::env::var("RUSTWEBUI_DIST_DIR") {
        candidates.push(PathBuf::from(custom_dist));
    }

    if let Ok(exe_path) = std::env::current_exe() {
        if let Some(exe_dir) = exe_path.parent() {
            candidates.push(exe_dir.join("dist"));
            if let Some(target_dir) = exe_dir.parent() {
                candidates.push(target_dir.join("dist"));
            }
        }
    }

    candidates.push(PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("dist"));

    if let Ok(cwd) = std::env::current_dir() {
        candidates.push(cwd.join("dist"));
    }

    for dist_dir in candidates {
        let index_path = dist_dir.join("index.html");
        if index_path.exists() {
            info!("Resolved frontend dist directory: {}", dist_dir.display());
            return Some((dist_dir, index_path));
        }
        warn!("Frontend dist candidate missing index.html: {}", dist_dir.display());
    }

    if let Some((dist_dir, index_path)) = materialize_embedded_frontend_dist() {
        info!(
            "Resolved frontend dist from embedded assets: {}",
            dist_dir.display()
        );
        return Some((dist_dir, index_path));
    }

    None
}

fn materialize_embedded_frontend_dist() -> Option<(PathBuf, PathBuf)> {
    if !EMBEDDED_FRONTEND_AVAILABLE {
        warn!("Embedded frontend assets unavailable");
        return None;
    }

    let base = std::env::temp_dir().join(format!("rustwebui-embedded-{}", std::process::id()));
    let dist_dir = base.join("dist");
    let js_dir = dist_dir.join("static").join("js");

    if let Err(e) = fs::create_dir_all(&js_dir) {
        warn!("Failed to create embedded dist directory: {}", e);
        return None;
    }

    let writes = [
        (dist_dir.join("index.html"), EMBEDDED_INDEX_HTML),
        (js_dir.join("main.js"), EMBEDDED_MAIN_JS),
        (js_dir.join("winbox.min.js"), EMBEDDED_WINBOX_JS),
        (js_dir.join("webui.js"), EMBEDDED_WEBUI_JS),
    ];

    for (path, contents) in writes {
        if let Err(e) = fs::write(&path, contents) {
            warn!("Failed to write embedded frontend file {}: {}", path.display(), e);
            return None;
        }
    }

    Some((dist_dir.clone(), dist_dir.join("index.html")))
}
