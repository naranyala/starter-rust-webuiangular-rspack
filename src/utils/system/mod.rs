#![allow(dead_code)]
use crate::core::domain::entities::SystemInfo;

pub struct SystemUtils;

impl SystemUtils {
    pub fn get_system_info() -> SystemInfo {
        SystemInfo {
            os_name: std::env::consts::OS.to_string(),
            os_version: "Unknown".to_string(), // Would need platform-specific code
            hostname: hostname::get()
                .unwrap_or_default()
                .to_string_lossy()
                .to_string(),
            cpu_cores: num_cpus::get(),
            local_ip: super::network::NetworkUtils::get_local_ip(),
            current_pid: std::process::id(),
        }
    }

    pub fn get_home_dir() -> Option<std::path::PathBuf> {
        dirs::home_dir()
    }

    pub fn get_temp_dir() -> std::path::PathBuf {
        std::env::temp_dir()
    }

    pub fn get_current_dir() -> std::io::Result<std::path::PathBuf> {
        std::env::current_dir()
    }
}
