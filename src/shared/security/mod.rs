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
