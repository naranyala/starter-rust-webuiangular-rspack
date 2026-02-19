// src/utils_demo.rs
// Demonstration of utility modules

use crate::utils::compression::CompressionUtils;
use crate::utils::crypto::{CryptoUtils, PasswordUtils};
use crate::utils::encoding::EncodingUtils;
use crate::utils::network::NetworkUtils;
use crate::utils::security::SecurityUtils;
use crate::utils::system::SystemUtils;
use crate::utils::validation::ValidationUtils;
use chrono::Utc;
use log::info;

pub fn run_utilities_demo() {
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
    let now = Utc::now();
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
    info!(
        "Gzip compression: {} -> {} bytes",
        test_data.len(),
        compressed.len()
    );

    // Security utilities
    let is_admin = SecurityUtils::check_admin();
    info!("Running as admin: {}", is_admin);
}
