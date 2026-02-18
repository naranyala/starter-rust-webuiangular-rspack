#![allow(dead_code)]
pub struct CryptoUtils;

impl CryptoUtils {
    pub fn sha256(data: &str) -> String {
        use sha2::{Digest, Sha256};
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
        use sha2::{Digest, Sha256};
        let salt = "fixed_salt_for_demo"; // In production, use random salt
        let mut hasher = Sha256::new();
        hasher.update(format!("{}{}", password, salt).as_bytes());
        Ok(format!("{:x}", hasher.finalize()))
    }
}
