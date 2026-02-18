#![allow(dead_code)]
pub struct ValidationUtils;

impl ValidationUtils {
    pub fn is_valid_email(email: &str) -> bool {
        email.contains('@') && email.contains('.')
    }

    pub fn is_valid_url(url: &str) -> bool {
        url.starts_with("http://") || url.starts_with("https://")
    }

    pub fn is_valid_phone(phone: &str) -> bool {
        phone
            .chars()
            .all(|c| c.is_ascii_digit() || c == '+' || c == '-' || c == '(' || c == ')' || c == ' ')
    }
}
