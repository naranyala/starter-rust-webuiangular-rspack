// src/core/error.rs
// Centralized error types for the application - "Errors as Values" pattern
//
// This module implements structured error handling where errors are:
// 1. First-class values that flow through the application
// 2. Rich in context and metadata (codes, causes, contexts)
// 3. Serializable for cross-boundary communication
// 4. Composable using Result<T, E> patterns

use std::fmt;
use std::collections::HashMap;
use serde::{Serialize, Deserialize};

/// Error codes for programmatic handling and frontend-backend protocol
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ErrorCode {
    // Database errors (1000-1999)
    DbConnectionFailed = 1000,
    DbQueryFailed = 1001,
    DbConstraintViolation = 1002,
    DbNotFound = 1003,
    DbAlreadyExists = 1004,
    
    // Configuration errors (2000-2999)
    ConfigNotFound = 2000,
    ConfigInvalid = 2001,
    ConfigMissingField = 2002,
    
    // Serialization errors (3000-3999)
    SerializationFailed = 3000,
    DeserializationFailed = 3001,
    InvalidFormat = 3002,
    
    // Validation errors (4000-4999)
    ValidationFailed = 4000,
    MissingRequiredField = 4001,
    InvalidFieldValue = 4002,
    
    // Not found errors (5000-5999)
    ResourceNotFound = 5000,
    UserNotFound = 5001,
    EntityNotFound = 5002,
    
    // System errors (6000-6999)
    LockPoisoned = 6000,
    InternalError = 6999,
    
    // Custom/unknown
    Unknown = 9999,
}

impl fmt::Display for ErrorCode {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ErrorCode::DbConnectionFailed => write!(f, "DB_CONNECTION_FAILED"),
            ErrorCode::DbQueryFailed => write!(f, "DB_QUERY_FAILED"),
            ErrorCode::DbConstraintViolation => write!(f, "DB_CONSTRAINT_VIOLATION"),
            ErrorCode::DbNotFound => write!(f, "DB_NOT_FOUND"),
            ErrorCode::DbAlreadyExists => write!(f, "DB_ALREADY_EXISTS"),
            ErrorCode::ConfigNotFound => write!(f, "CONFIG_NOT_FOUND"),
            ErrorCode::ConfigInvalid => write!(f, "CONFIG_INVALID"),
            ErrorCode::ConfigMissingField => write!(f, "CONFIG_MISSING_FIELD"),
            ErrorCode::SerializationFailed => write!(f, "SERIALIZATION_FAILED"),
            ErrorCode::DeserializationFailed => write!(f, "DESERIALIZATION_FAILED"),
            ErrorCode::InvalidFormat => write!(f, "INVALID_FORMAT"),
            ErrorCode::ValidationFailed => write!(f, "VALIDATION_FAILED"),
            ErrorCode::MissingRequiredField => write!(f, "MISSING_REQUIRED_FIELD"),
            ErrorCode::InvalidFieldValue => write!(f, "INVALID_FIELD_VALUE"),
            ErrorCode::ResourceNotFound => write!(f, "RESOURCE_NOT_FOUND"),
            ErrorCode::UserNotFound => write!(f, "USER_NOT_FOUND"),
            ErrorCode::EntityNotFound => write!(f, "ENTITY_NOT_FOUND"),
            ErrorCode::LockPoisoned => write!(f, "LOCK_POISONED"),
            ErrorCode::InternalError => write!(f, "INTERNAL_ERROR"),
            ErrorCode::Unknown => write!(f, "UNKNOWN"),
        }
    }
}

/// Structured error value with metadata for cross-boundary communication
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ErrorValue {
    /// Machine-readable error code
    pub code: ErrorCode,
    /// Human-readable message
    pub message: String,
    /// Optional detailed technical information
    #[serde(skip_serializing_if = "Option::is_none")]
    pub details: Option<String>,
    /// Optional field that caused the error (for validation errors)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub field: Option<String>,
    /// Optional underlying cause (for error chains)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cause: Option<String>,
    /// Optional context key-value pairs
    #[serde(skip_serializing_if = "Option::is_none")]
    pub context: Option<HashMap<String, String>>,
}

impl ErrorValue {
    pub fn new(code: ErrorCode, message: impl Into<String>) -> Self {
        Self {
            code,
            message: message.into(),
            details: None,
            field: None,
            cause: None,
            context: None,
        }
    }

    pub fn with_details(mut self, details: impl Into<String>) -> Self {
        self.details = Some(details.into());
        self
    }

    pub fn with_field(mut self, field: impl Into<String>) -> Self {
        self.field = Some(field.into());
        self
    }

    pub fn with_cause(mut self, cause: impl Into<String>) -> Self {
        self.cause = Some(cause.into());
        self
    }

    pub fn with_context(mut self, key: impl Into<String>, value: impl Into<String>) -> Self {
        self.context
            .get_or_insert_with(HashMap::new)
            .insert(key.into(), value.into());
        self
    }

    /// Convert to API response format for frontend consumption
    pub fn to_response(&self) -> serde_json::Value {
        let mut map = serde_json::Map::new();
        map.insert("code".to_string(), serde_json::json!(self.code.to_string()));
        map.insert("message".to_string(), serde_json::json!(self.message));
        if let Some(ref details) = self.details {
            map.insert("details".to_string(), serde_json::json!(details));
        }
        if let Some(ref field) = self.field {
            map.insert("field".to_string(), serde_json::json!(field));
        }
        if let Some(ref cause) = self.cause {
            map.insert("cause".to_string(), serde_json::json!(cause));
        }
        if let Some(ref context) = self.context {
            map.insert("context".to_string(), serde_json::json!(context));
        }
        serde_json::Value::Object(map)
    }
}

impl fmt::Display for ErrorValue {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "[{}] {}", self.code, self.message)?;
        if let Some(ref details) = self.details {
            write!(f, " ({})", details)?;
        }
        Ok(())
    }
}

/// Application error enum using structured error values
#[derive(Debug, Clone)]
pub enum AppError {
    Database(ErrorValue),
    DependencyInjection(ErrorValue),
    EventBus(ErrorValue),
    Logging(ErrorValue),
    Configuration(ErrorValue),
    Serialization(ErrorValue),
    Validation(ErrorValue),
    NotFound(ErrorValue),
    LockPoisoned(ErrorValue),
}

impl AppError {
    /// Extract the error value for serialization
    pub fn to_value(&self) -> &ErrorValue {
        match self {
            AppError::Database(v) => v,
            AppError::DependencyInjection(v) => v,
            AppError::EventBus(v) => v,
            AppError::Logging(v) => v,
            AppError::Configuration(v) => v,
            AppError::Serialization(v) => v,
            AppError::Validation(v) => v,
            AppError::NotFound(v) => v,
            AppError::LockPoisoned(v) => v,
        }
    }

    /// Convert to JSON for frontend consumption
    pub fn to_json(&self) -> serde_json::Value {
        self.to_value().to_response()
    }
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.to_value())
    }
}

impl std::error::Error for AppError {}

// From implementations for common error types
impl From<rusqlite::Error> for AppError {
    fn from(err: rusqlite::Error) -> Self {
        let error_value = ErrorValue::new(ErrorCode::DbQueryFailed, err.to_string())
            .with_cause("SQLite operation failed");
        AppError::Database(error_value)
    }
}

impl From<std::io::Error> for AppError {
    fn from(err: std::io::Error) -> Self {
        let error_value = ErrorValue::new(ErrorCode::InternalError, err.to_string())
            .with_cause("I/O operation failed");
        AppError::Logging(error_value)
    }
}

impl From<serde_json::Error> for AppError {
    fn from(err: serde_json::Error) -> Self {
        let error_value = ErrorValue::new(ErrorCode::SerializationFailed, err.to_string())
            .with_cause("JSON serialization failed");
        AppError::Serialization(error_value)
    }
}

/// Standard result type for application operations
pub type AppResult<T> = Result<T, AppError>;

/// Extension trait for converting Option/Result to AppResult
pub trait ToAppResult<T> {
    fn to_app_error(self, context: &str) -> AppResult<T>;
}

impl<T> ToAppResult<T> for Option<T> {
    fn to_app_error(self, context: &str) -> AppResult<T> {
        self.ok_or_else(|| {
            AppError::NotFound(
                ErrorValue::new(ErrorCode::ResourceNotFound, context)
            )
        })
    }
}

impl<T, E: fmt::Display> ToAppResult<T> for Result<T, E> {
    fn to_app_error(self, context: &str) -> AppResult<T> {
        self.map_err(|e| {
            AppError::Database(
                ErrorValue::new(ErrorCode::DbQueryFailed, format!("{}: {}", context, e))
                    .with_cause("Database operation failed")
            )
        })
    }
}

/// Helper functions for creating common errors
pub mod errors {
    use super::*;

    pub fn db_not_found(entity: &str, id: impl fmt::Display) -> AppError {
        AppError::NotFound(
            ErrorValue::new(ErrorCode::DbNotFound, format!("{} not found: {}", entity, id))
                .with_field("id")
                .with_context("entity", entity)
        )
    }

    pub fn validation_failed(field: &str, message: &str) -> AppError {
        AppError::Validation(
            ErrorValue::new(ErrorCode::ValidationFailed, message.to_string())
                .with_field(field)
        )
    }

    pub fn not_found(resource: &str, id: impl fmt::Display) -> AppError {
        AppError::NotFound(
            ErrorValue::new(ErrorCode::ResourceNotFound, format!("{} not found: {}", resource, id))
                .with_context("resource", resource)
        )
    }

    pub fn internal(message: &str) -> AppError {
        AppError::LockPoisoned(
            ErrorValue::new(ErrorCode::InternalError, message.to_string())
        )
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_error_value_creation() {
        let error = ErrorValue::new(ErrorCode::DbNotFound, "User not found")
            .with_field("user_id")
            .with_context("table", "users");
        
        assert_eq!(error.code, ErrorCode::DbNotFound);
        assert_eq!(error.message, "User not found");
        assert_eq!(error.field, Some("user_id".to_string()));
    }

    #[test]
    fn test_error_value_serialization() {
        let error = ErrorValue::new(ErrorCode::ValidationFailed, "Invalid email");
        let json = error.to_response();
        
        assert!(json.get("code").is_some());
        assert!(json.get("message").is_some());
    }

    #[test]
    fn test_error_helpers() {
        let err = errors::db_not_found("User", 123);
        assert!(matches!(err, AppError::NotFound(_)));
        
        let err = errors::validation_failed("email", "Must be valid email");
        assert!(matches!(err, AppError::Validation(_)));
    }
}
