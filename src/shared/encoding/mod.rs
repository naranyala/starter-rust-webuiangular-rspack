use base64::Engine;

#[derive(Debug, Clone)]
pub enum EncodingError {
    InvalidEncoding,
    DecodingError(String),
    EncodingError(String),
}

pub struct EncodingUtils;

impl EncodingUtils {
    pub fn encode_base64(input: &[u8]) -> String {
        base64::engine::general_purpose::STANDARD.encode(input)
    }

    pub fn decode_base64(input: &str) -> Result<Vec<u8>, EncodingError> {
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
