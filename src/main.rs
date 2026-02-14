use log::info;
use std::sync::Arc;
use webui_rs::webui;

// Import from infrastructure layer
mod infrastructure;
use infrastructure::{config::AppConfig, database::Database, logging, di};

// Import application layer
mod application;
use application::*;

// Import domain layer
mod domain;
use domain::*;

// Import presentation layer
mod presentation;

// Import shared utilities
mod shared;
use shared::*;



// Build-time generated config
include!(concat!(env!("OUT_DIR"), "/build_config.rs"));

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
    let hashed = PasswordUtils::hash_password(password).unwrap();
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

    // Set up UI event handlers from presentation layer
    presentation::ui_handlers::setup_ui_handlers(&mut my_window);
    presentation::ui_handlers::setup_counter_handlers(&mut my_window);
    presentation::db_handlers::setup_db_handlers(&mut my_window);
    presentation::sysinfo_handlers::setup_sysinfo_handlers(&mut my_window);
    presentation::logging_handlers::setup_logging_handlers(&mut my_window);
    presentation::event_bus_handlers::setup_event_bus_handlers(&mut my_window);

    // Get window settings from config
    let window_title = config.get_window_title();
    info!("Window title: {}", window_title);

    // Show the built application - use the root index.html which has correct paths to static files
    info!("Loading application UI from root index.html");
    my_window.show("index.html");

    info!("Application started successfully, waiting for events...");
    info!("=============================================");

    // Wait until all windows are closed
    webui::wait();

    info!("Application shutting down...");
    info!("=============================================");
}
