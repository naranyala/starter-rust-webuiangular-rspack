// src/shared/serialization/mod.rs
// Serialization utilities for backend-frontend communication
// Supports multiple formats: JSON, MessagePack, CBOR

use serde::{Deserialize, Serialize};
use std::fmt;

/// Supported serialization formats
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SerializationFormat {
    Json,
    MessagePack,
    Cbor,
}

impl fmt::Display for SerializationFormat {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            SerializationFormat::Json => write!(f, "JSON"),
            SerializationFormat::MessagePack => write!(f, "MessagePack"),
            SerializationFormat::Cbor => write!(f, "CBOR"),
        }
    }
}

impl SerializationFormat {
    /// Get all available formats
    pub fn available_formats() -> &'static [SerializationFormat] {
        &[
            SerializationFormat::Json,
            SerializationFormat::MessagePack,
            SerializationFormat::Cbor,
        ]
    }

    /// Get the currently selected format
    pub fn selected() -> SerializationFormat {
        // Default to JSON for web compatibility
        SerializationFormat::Json
    }

    /// Get format description
    pub fn description(&self) -> &'static str {
        match self {
            SerializationFormat::Json => "Standard JSON - Human readable, universal support",
            SerializationFormat::MessagePack => "Binary format - Smaller size, faster than JSON",
            SerializationFormat::Cbor => "CBOR binary - RFC 7049, efficient for embedded",
        }
    }

    /// Get format pros
    pub fn pros(&self) -> &'static [&'static str] {
        match self {
            SerializationFormat::Json => &[
                "Human readable",
                "Universal browser support",
                "Easy debugging",
                "Wide ecosystem",
            ],
            SerializationFormat::MessagePack => &[
                "Smaller payload size (~30% smaller than JSON)",
                "Faster serialization/deserialization",
                "Type preservation",
                "Good Rust support",
            ],
            SerializationFormat::Cbor => &[
                "RFC 7049 standard",
                "Very compact binary format",
                "Self-describing",
                "Good for embedded systems",
            ],
        }
    }

    /// Get format cons
    pub fn cons(&self) -> &'static [&'static str] {
        match self {
            SerializationFormat::Json => &[
                "Larger payload size",
                "Slower than binary formats",
                "No binary data support (needs base64)",
            ],
            SerializationFormat::MessagePack => &[
                "Not human readable",
                "Requires additional library",
                "Less universal than JSON",
            ],
            SerializationFormat::Cbor => &[
                "Not human readable",
                "Limited browser support",
                "Smaller ecosystem than JSON",
            ],
        }
    }
}

/// Serialization statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SerializationStats {
    pub format: String,
    pub total_serializations: u64,
    pub total_deserializations: u64,
    pub total_bytes_sent: u64,
    pub total_bytes_received: u64,
    pub avg_serialization_time_us: f64,
    pub avg_deserialization_time_us: f64,
    pub compression_ratio: f64,
}

impl Default for SerializationStats {
    fn default() -> Self {
        Self {
            format: "JSON".to_string(),
            total_serializations: 0,
            total_deserializations: 0,
            total_bytes_sent: 0,
            total_bytes_received: 0,
            avg_serialization_time_us: 0.0,
            avg_deserialization_time_us: 0.0,
            compression_ratio: 1.0,
        }
    }
}

/// Serialize data to the specified format
pub fn serialize<T: Serialize>(value: &T, format: SerializationFormat) -> Result<String, String> {
    match format {
        SerializationFormat::Json => {
            serde_json::to_string(value).map_err(|e| format!("JSON serialize error: {}", e))
        }
        SerializationFormat::MessagePack => {
            let bytes = rmp_serde::to_vec(value)
                .map_err(|e| format!("MessagePack serialize error: {}", e))?;
            Ok(base64_encode(&bytes))
        }
        SerializationFormat::Cbor => {
            let bytes = serde_cbor::to_vec(value)
                .map_err(|e| format!("CBOR serialize error: {}", e))?;
            Ok(base64_encode(&bytes))
        }
    }
}

/// Deserialize data from the specified format
pub fn deserialize<T: for<'de> Deserialize<'de>>(
    data: &str,
    format: SerializationFormat,
) -> Result<T, String> {
    match format {
        SerializationFormat::Json => {
            serde_json::from_str(data).map_err(|e| format!("JSON deserialize error: {}", e))
        }
        SerializationFormat::MessagePack => {
            let bytes = base64_decode(data)
                .map_err(|e| format!("MessagePack base64 decode error: {}", e))?;
            rmp_serde::from_slice(&bytes)
                .map_err(|e| format!("MessagePack deserialize error: {}", e))
        }
        SerializationFormat::Cbor => {
            let bytes = base64_decode(data)
                .map_err(|e| format!("CBOR base64 decode error: {}", e))?;
            serde_cbor::from_slice(&bytes)
                .map_err(|e| format!("CBOR deserialize error: {}", e))
        }
    }
}

/// Base64 encode for binary data transport over text protocols
fn base64_encode(data: &[u8]) -> String {
    base64::encode(data)
}

/// Base64 decode for binary data transport over text protocols
fn base64_decode(data: &str) -> Result<Vec<u8>, String> {
    base64::decode(data).map_err(|e| format!("Base64 decode error: {}", e))
}

/// Get comparison table of all formats
pub fn get_format_comparison() -> Vec<FormatComparison> {
    vec![
        FormatComparison {
            format: "JSON".to_string(),
            size_ratio: "1.0x (baseline)".to_string(),
            speed_ratio: "1.0x (baseline)".to_string(),
            readability: "✅ Human readable".to_string(),
            browser_support: "✅ Universal".to_string(),
            use_case: "Default, debugging, APIs".to_string(),
        },
        FormatComparison {
            format: "MessagePack".to_string(),
            size_ratio: "~0.7x (30% smaller)".to_string(),
            speed_ratio: "~1.5x faster".to_string(),
            readability: "❌ Binary".to_string(),
            browser_support: "⚠️ Needs library".to_string(),
            use_case: "Performance-critical".to_string(),
        },
        FormatComparison {
            format: "CBOR".to_string(),
            size_ratio: "~0.6x (40% smaller)".to_string(),
            speed_ratio: "~1.6x faster".to_string(),
            readability: "❌ Binary".to_string(),
            browser_support: "⚠️ Limited".to_string(),
            use_case: "Embedded, IoT".to_string(),
        },
    ]
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FormatComparison {
    pub format: String,
    pub size_ratio: String,
    pub speed_ratio: String,
    pub readability: String,
    pub browser_support: String,
    pub use_case: String,
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde::{Deserialize, Serialize};

    #[derive(Debug, Serialize, Deserialize, PartialEq)]
    struct TestData {
        name: String,
        value: i32,
    }

    #[test]
    fn test_json_serialization() {
        let data = TestData {
            name: "test".to_string(),
            value: 42,
        };
        let serialized = serialize(&data, SerializationFormat::Json).unwrap();
        let deserialized: TestData = deserialize(&serialized, SerializationFormat::Json).unwrap();
        assert_eq!(data, deserialized);
    }

    #[test]
    fn test_messagepack_serialization() {
        let data = TestData {
            name: "test".to_string(),
            value: 42,
        };
        let serialized = serialize(&data, SerializationFormat::MessagePack).unwrap();
        let deserialized: TestData = deserialize(&serialized, SerializationFormat::MessagePack).unwrap();
        assert_eq!(data, deserialized);
    }

    #[test]
    fn test_cbor_serialization() {
        let data = TestData {
            name: "test".to_string(),
            value: 42,
        };
        let serialized = serialize(&data, SerializationFormat::Cbor).unwrap();
        let deserialized: TestData = deserialize(&serialized, SerializationFormat::Cbor).unwrap();
        assert_eq!(data, deserialized);
    }
}
