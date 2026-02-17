// core/backend/src/error/handler.rs
//! Error Handler - Centralized Error Processing
//! 
//! Provides centralized error handling, logging, and conversion to API responses.

use std::collections::HashMap;

use super::{AppError, Error};
use crate::error::DomainError;

/// Error handler for centralized error processing
pub struct ErrorHandler {
    /// Whether to include backtraces
    include_backtrace: bool,
    /// Whether to include source errors
    include_source: bool,
    /// Custom error codes mapping
    error_codes: HashMap<String, String>,
}

impl ErrorHandler {
    pub fn new() -> Self {
        Self {
            include_backtrace: false,
            include_source: false,
            error_codes: HashMap::new(),
        }
    }
    
    /// Enable backtrace in error responses (debug only)
    pub fn with_backtrace(mut self, enable: bool) -> Self {
        self.include_backtrace = enable;
        self
    }
    
    /// Include source error chain
    pub fn with_source(mut self, enable: bool) -> Self {
        self.include_source = enable;
        self
    }
    
    /// Register custom error code mapping
    pub fn with_error_code(mut self, code: String, mapped: String) -> Self {
        self.error_codes.insert(code, mapped);
        self
    }
    
    /// Handle an error and return formatted response
    pub fn handle(&self, error: &Error) -> ErrorResponse {
        let mut response = ErrorResponse {
            success: false,
            error: ErrorData {
                code: self.map_code(error.code()),
                message: error.message.clone(),
                kind: self.error_kind_to_string(&error.kind),
                context: error.context.clone(),
            },
        };
        
        if self.include_source {
            if let Some(source) = &error.source {
                response.error.source = Some(source.to_string());
            }
        }
        
        #[cfg(feature = "backtrace")]
        if self.include_backtrace {
            if let Some(bt) = &error.backtrace {
                response.error.backtrace = Some(format!("{:?}", bt));
            }
        }
        
        // Log the error
        self.log_error(error);
        
        response
    }
    
    /// Handle AppError directly
    pub fn handle_app_error(&self, error: &AppError) -> ErrorResponse {
        let error = Error::new(error.clone());
        self.handle(&error)
    }
    
    /// Log error to appropriate channel
    fn log_error(&self, error: &Error) {
        let level = self.get_log_level(&error.kind);
        
        match level {
            LogLevel::Error => log::error!("[Error] {} (code: {})", error.message, error.code()),
            LogLevel::Warn => log::warn!("[Error] {} (code: {})", error.message, error.code()),
            LogLevel::Info => log::info!("[Error] {} (code: {})", error.message, error.code()),
        }
        
        if !error.context.is_empty() {
            match level {
                LogLevel::Error => log::error!("Context: {:?}", error.context),
                LogLevel::Warn => log::warn!("Context: {:?}", error.context),
                LogLevel::Info => log::info!("Context: {:?}", error.context),
            }
        }
    }
    
    /// Determine log level based on error kind
    fn get_log_level(&self, kind: &AppError) -> LogLevel {
        match kind {
            AppError::Domain(DomainError::NotFound { .. }) => LogLevel::Warn,
            AppError::Domain(DomainError::Validation { .. }) => LogLevel::Warn,
            AppError::Application(_) => LogLevel::Warn,
            AppError::Infrastructure(_) => LogLevel::Error,
            AppError::Plugin(_) => LogLevel::Error,
            _ => LogLevel::Error,
        }
    }
    
    /// Map error code to custom code if registered
    fn map_code(&self, code: &'static str) -> String {
        self.error_codes
            .get(code)
            .cloned()
            .unwrap_or_else(|| code.to_string())
    }
    
    /// Convert error kind to string
    fn error_kind_to_string(&self, kind: &AppError) -> String {
        match kind {
            AppError::Domain(e) => format!("Domain::{}", e),
            AppError::Infrastructure(e) => format!("Infrastructure::{}", e),
            AppError::Application(e) => format!("Application::{}", e),
            AppError::Plugin(e) => format!("Plugin::{}", e),
        }
    }
}

impl Default for ErrorHandler {
    fn default() -> Self {
        Self::new()
    }
}

/// Error response for API
#[derive(Debug, Clone)]
pub struct ErrorResponse {
    pub success: bool,
    pub error: ErrorData,
}

impl ErrorResponse {
    /// Convert to JSON string
    pub fn to_json(&self) -> String {
        let mut json_obj = serde_json::json!({
            "success": self.success,
            "error": {
                "code": self.error.code,
                "message": self.error.message,
                "kind": self.error.kind,
                "context": self.error.context,
                "source": self.error.source,
            }
        });
        
        #[cfg(feature = "backtrace")]
        if let Some(ref bt) = self.error.backtrace {
            if let Some(obj) = json_obj.as_object_mut() {
                if let Some(error) = obj.get_mut("error").and_then(|e| e.as_object_mut()) {
                    error.insert("backtrace".to_string(), serde_json::json!(bt));
                }
            }
        }
        
        json_obj.to_string()
    }
}

/// Error data for response
#[derive(Debug, Clone, Default)]
pub struct ErrorData {
    pub code: String,
    pub message: String,
    pub kind: String,
    pub context: HashMap<String, String>,
    pub source: Option<String>,
    #[cfg(feature = "backtrace")]
    pub backtrace: Option<String>,
}

/// Log level for errors
enum LogLevel {
    Info,
    Warn,
    Error,
}

/// Macro for creating validation errors easily
#[macro_export]
macro_rules! validation_error {
    ($field:expr, $message:expr) => {
        $crate::error::errors::validation::<()>($field, $message)
    };
    ($field:expr, $message:expr, $value:expr) => {
        Err($crate::error::AppError::validation_with_value($field, $message, $value).into())
    };
}

/// Macro for creating not found errors
#[macro_export]
macro_rules! not_found_error {
    ($entity:expr, $id:expr) => {
        $crate::error::errors::not_found::<()>($entity, $id)
    };
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_error_handler() {
        let handler = ErrorHandler::new();
        let error = Error::new(AppError::not_found("User", "123"));
        let response = handler.handle(&error);
        
        assert!(!response.success);
        assert_eq!(response.error.code, "NOT_FOUND");
    }
    
    #[test]
    fn test_error_response_json() {
        let handler = ErrorHandler::new();
        let error = Error::new(AppError::validation("email", "Invalid format"));
        let response = handler.handle(&error);
        
        let json = response.to_json();
        assert!(json.contains("VALIDATION_ERROR"));
        assert!(json.contains("Invalid format"));
    }
}
