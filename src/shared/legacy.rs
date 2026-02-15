use std::collections::HashMap;
use std::fs::{self, File};
use std::io::{self, BufReader, Read, Write};
use std::path::PathBuf;
use log::info;

// ==================== CONFIGURATION MODULE ====================
#[derive(Debug, Clone)]
pub enum ConfigError {
    FileNotFound(String),
    ParseError(String),
    IoError(String),
    InvalidFormat(String),
}

pub struct ConfigUtils;

impl ConfigUtils {
    pub fn read_json<T: for<'de> serde::Deserialize<'de>>(
        path: &PathBuf,
    ) -> Result<T, ConfigError> {
        let content = fs::read_to_string(path).map_err(|e| ConfigError::IoError(e.to_string()))?;

        serde_json::from_str(&content).map_err(|e| ConfigError::ParseError(e.to_string()))
    }

    pub fn write_json<T: serde::Serialize>(path: &PathBuf, value: &T) -> Result<(), ConfigError> {
        let content = serde_json::to_string_pretty(value)
            .map_err(|e| ConfigError::ParseError(e.to_string()))?;

        fs::write(path, content).map_err(|e| ConfigError::IoError(e.to_string()))
    }

    pub fn read_env_file(path: &PathBuf) -> Result<HashMap<String, String>, ConfigError> {
        let content = fs::read_to_string(path).map_err(|e| ConfigError::IoError(e.to_string()))?;

        let mut vars = HashMap::new();

        for line in content.lines() {
            let line = line.trim();

            if line.is_empty() || line.starts_with('#') {
                continue;
            }

            if let Some(eq_idx) = line.find('=') {
                let key = line[..eq_idx].trim().to_string();
                let value = line[eq_idx + 1..].trim().to_string();
                vars.insert(key, value);
            }
        }

        Ok(vars)
    }

    pub fn write_env_file(
        path: &PathBuf,
        vars: &HashMap<String, String>,
    ) -> Result<(), ConfigError> {
        let mut content = String::new();

        for (key, value) in vars {
            content.push_str(&format!("{}={}\n", key, value));
        }

        fs::write(path, content).map_err(|e| ConfigError::IoError(e.to_string()))
    }

    pub fn load_env_file(path: &PathBuf) {
        if let Ok(vars) = Self::read_env_file(path) {
            for (key, value) in vars {
                unsafe {
                    std::env::set_var(&key, &value);
                }
            }
        }
    }
}

// ==================== ENCODING MODULE ====================
#[derive(Debug, Clone)]
pub enum EncodingError {
    InvalidEncoding,
    DecodingError(String),
    EncodingError(String),
}

pub struct EncodingUtils;

impl EncodingUtils {
    pub fn encode_base64(input: &[u8]) -> String {
        use base64::Engine;
        base64::engine::general_purpose::STANDARD.encode(input)
    }

    pub fn decode_base64(input: &str) -> Result<Vec<u8>, EncodingError> {
        use base64::Engine;
        base64::engine::general_purpose::STANDARD
            .decode(input)
            .map_err(|e| EncodingError::DecodingError(e.to_string()))
    }

    pub fn encode_hex(input: &[u8]) -> String {
        hex::encode(input)
    }

    pub fn decode_hex(input: &str) -> Result<Vec<u8>, EncodingError> {
        hex::decode(input).map_err(|e| EncodingError::DecodingError(e.to_string()))
    }

    pub fn encode_hex_uppercase(input: &[u8]) -> String {
        hex::encode(input).to_uppercase()
    }

    pub fn encode_url_safe(input: &str) -> String {
        input
            .chars()
            .map(|c| match c {
                'A'..='Z' | 'a'..='z' | '0'..='9' | '-' | '_' | '.' | '~' => c.to_string(),
                _ => format!("%{:02X}", c as u8),
            })
            .collect()
    }

    pub fn decode_url_safe(input: &str) -> String {
        let mut result = String::new();
        let mut chars = input.chars().peekable();

        while let Some(c) = chars.next() {
            if c == '%' {
                let hex1 = chars.next().unwrap_or('0');
                let hex2 = chars.next().unwrap_or('0');
                let hex_str = format!("{}{}", hex1, hex2);
                if let Ok(byte) = u8::from_str_radix(&hex_str, 16) {
                    result.push(byte as char);
                } else {
                    result.push('%');
                    result.push(hex1);
                    result.push(hex2);
                }
            } else {
                result.push(c);
            }
        }

        result
    }
}

// ==================== CRYPTOGRAPHY MODULE ====================
pub struct CryptoUtils;

impl CryptoUtils {
    pub fn sha256(data: &str) -> String {
        use sha2::{Sha256, Digest};
        let mut hasher = Sha256::new();
        hasher.update(data.as_bytes());
        format!("{:x}", hasher.finalize())
    }

    pub fn md5(data: &str) -> String {
        use md5::compute;
        format!("{:x}", compute(data.as_bytes()))
    }
}

pub struct PasswordUtils;

impl PasswordUtils {
    pub fn hash_password(password: &str) -> Result<String, String> {
        use sha2::{Sha256, Digest};
        let salt = "fixed_salt_for_demo"; // In production, use random salt
        let mut hasher = Sha256::new();
        hasher.update(format!("{}{}", password, salt).as_bytes());
        Ok(format!("{:x}", hasher.finalize()))
    }
}

// ==================== VALIDATION MODULE ====================
pub struct ValidationUtils;

impl ValidationUtils {
    pub fn is_valid_email(email: &str) -> bool {
        email.contains('@') && email.contains('.')
    }

    pub fn is_valid_url(url: &str) -> bool {
        url.starts_with("http://") || url.starts_with("https://")
    }

    pub fn is_valid_phone(phone: &str) -> bool {
        phone.chars().all(|c| c.is_ascii_digit() || c == '+' || c == '-' || c == '(' || c == ')' || c == ' ')
    }
}

// ==================== DATE/TIME MODULE ====================
pub struct DateTimeUtils;

impl DateTimeUtils {
    pub fn now() -> chrono::DateTime<chrono::Utc> {
        chrono::Utc::now()
    }

    pub fn format_datetime(dt: &chrono::DateTime<chrono::Utc>) -> String {
        dt.format("%Y-%m-%d %H:%M:%S UTC").to_string()
    }

    pub fn timestamp() -> i64 {
        chrono::Utc::now().timestamp()
    }
}

// ==================== SYSTEM UTILITIES ====================
pub struct SystemUtils;

impl SystemUtils {
    pub fn get_system_info() -> SystemInfo {
        SystemInfo {
            os_name: std::env::consts::OS.to_string(),
            os_version: "Unknown".to_string(), // Would need platform-specific code
            hostname: hostname::get().unwrap_or_default().to_string_lossy().to_string(),
            cpu_cores: num_cpus::get(),
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

#[derive(Debug)]
pub struct SystemInfo {
    pub os_name: String,
    pub os_version: String,
    pub hostname: String,
    pub cpu_cores: usize,
}

// ==================== FILE OPERATIONS ====================
pub struct FileUtils;

impl FileUtils {
    pub fn read_file(path: &PathBuf) -> Result<String, String> {
        fs::read_to_string(path).map_err(|e| e.to_string())
    }

    pub fn write_file(path: &PathBuf, content: &str) -> Result<(), String> {
        fs::write(path, content).map_err(|e| e.to_string())
    }

    pub fn file_exists(path: &PathBuf) -> bool {
        path.exists()
    }

    pub fn create_dir(path: &PathBuf) -> Result<(), String> {
        std::fs::create_dir_all(path).map_err(|e| e.to_string())
    }

    pub fn copy_file(from: &PathBuf, to: &PathBuf) -> Result<(), String> {
        std::fs::copy(from, to).map(|_| ()).map_err(|e| e.to_string())
    }

    pub fn delete_file(path: &PathBuf) -> Result<(), String> {
        std::fs::remove_file(path).map_err(|e| e.to_string())
    }
}

// ==================== NETWORK UTILITIES ====================
pub struct NetworkUtils;

impl NetworkUtils {
    pub fn get_local_ip() -> Option<String> {
        use std::net::UdpSocket;
        // Connect to a dummy address to determine local IP
        let socket = UdpSocket::bind("0.0.0.0:0").ok()?;
        socket.connect("8.8.8.8:80").ok()?;
        socket.local_addr().ok().map(|addr| addr.ip().to_string())
    }

    pub fn is_port_available(port: u16) -> bool {
        use std::net::TcpListener;
        TcpListener::bind(("127.0.0.1", port)).is_ok()
    }
}

// ==================== PROCESS UTILITIES ====================
pub struct ProcessUtils;

impl ProcessUtils {
    pub fn get_current_pid() -> u32 {
        std::process::id()
    }

    pub fn execute_command(cmd: &str, args: &[&str]) -> Result<String, String> {
        let output = std::process::Command::new(cmd)
            .args(args)
            .output()
            .map_err(|e| e.to_string())?;

        if output.status.success() {
            String::from_utf8(output.stdout).map_err(|e| e.to_string())
        } else {
            String::from_utf8(output.stderr).map_err(|e| e.to_string())
        }
    }
}

// ==================== COMPRESSION UTILITIES ====================
pub struct CompressionUtils;

impl CompressionUtils {
    pub fn compress_gzip(input: &[u8]) -> Result<Vec<u8>, String> {
        let mut encoder = flate2::write::GzEncoder::new(Vec::new(), flate2::Compression::default());
        encoder
            .write_all(input)
            .map_err(|e| e.to_string())?;

        encoder
            .finish()
            .map_err(|e| e.to_string())
    }

    pub fn decompress_gzip(input: &[u8]) -> Result<Vec<u8>, String> {
        let decoder = flate2::read::GzDecoder::new(input);
        let mut decoder = BufReader::new(decoder);
        let mut result = Vec::new();

        decoder
            .read_to_end(&mut result)
            .map_err(|e| e.to_string())?;

        Ok(result)
    }
}

// ==================== SECURITY UTILITIES ====================
pub struct SecurityUtils;

impl SecurityUtils {
    pub fn check_admin() -> bool {
        // Simplified check - in real apps this would be platform-specific
        match whoami::username() {
            Ok(username) => username == "root" || username == "Administrator",
            Err(_) => false,
        }
    }

    pub fn encrypt_bytes(data: &[u8], key: &str) -> Result<Vec<u8>, String> {
        // Simple XOR encryption for demo purposes
        let mut result = Vec::with_capacity(data.len());
        for (i, &byte) in data.iter().enumerate() {
            let key_byte = key.as_bytes()[i % key.len()];
            result.push(byte ^ key_byte);
        }
        Ok(result)
    }

    pub fn decrypt_bytes(data: &[u8], key: &str) -> Result<Vec<u8>, String> {
        // XOR is symmetric
        Self::encrypt_bytes(data, key)
    }
}

// ==================== CLIPBOARD UTILITIES ====================
pub struct ClipboardUtils;

impl ClipboardUtils {
    pub fn read_text() -> Result<String, String> {
        #[cfg(feature = "clipboard")]
        {
            let mut ctx = arboard::Clipboard::new().map_err(|e| e.to_string())?;
            ctx.get_text().map_err(|e| e.to_string())
        }
        #[cfg(not(feature = "clipboard"))]
        {
            Err("Clipboard feature not enabled".to_string())
        }
    }

    pub fn write_text(text: &str) -> Result<(), String> {
        #[cfg(feature = "clipboard")]
        {
            let mut ctx = arboard::Clipboard::new().map_err(|e| e.to_string())?;
            ctx.set_text(text).map_err(|e| e.to_string())
        }
        #[cfg(not(feature = "clipboard"))]
        {
            Err("Clipboard feature not enabled".to_string())
        }
    }
}