// core/backend/src/error/error.rs
//! Enhanced Error with Context
//! 
//! Provides an error wrapper that carries additional context information.

use std::collections::HashMap;
use std::fmt;
use std::error::Error as StdError;

use super::AppError;

/// Enhanced error with context information
#[derive(Debug)]
pub struct Error {
    /// The underlying error kind
    pub kind: AppError,
    /// Human-readable message
    pub message: String,
    /// Source error (if chained)
    pub source: Option<Box<dyn StdError + Send + Sync + 'static>>,
    /// Additional context (key-value pairs)
    pub context: HashMap<String, String>,
    /// Backtrace (if enabled)
    #[cfg(feature = "backtrace")]
    pub backtrace: Option<backtrace::Backtrace>,
}

impl Error {
    /// Create a new error from an AppError
    pub fn new(kind: AppError) -> Self {
        Self {
            message: kind.to_string(),
            kind,
            source: None,
            context: HashMap::new(),
            #[cfg(feature = "backtrace")]
            backtrace: Some(backtrace::Backtrace::new()),
        }
    }
    
    /// Create a new error with a custom message
    pub fn with_message(kind: AppError, message: impl Into<String>) -> Self {
        Self {
            message: message.into(),
            kind,
            source: None,
            context: HashMap::new(),
            #[cfg(feature = "backtrace")]
            backtrace: Some(backtrace::Backtrace::new()),
        }
    }
    
    /// Add context to the error
    pub fn with_context<K, V>(mut self, key: K, value: V) -> Self
    where
        K: Into<String>,
        V: Into<String>,
    {
        self.context.insert(key.into(), value.into());
        self
    }
    
    /// Add source error
    pub fn with_source(mut self, source: impl StdError + Send + Sync + 'static) -> Self {
        self.source = Some(Box::new(source));
        self
    }
    
    /// Get error code
    pub fn code(&self) -> &'static str {
        self.kind.code()
    }
    
    /// Check if this is a not found error
    pub fn is_not_found(&self) -> bool {
        self.kind.is_not_found()
    }
    
    /// Check if this is a validation error
    pub fn is_validation(&self) -> bool {
        self.kind.is_validation()
    }
    
    /// Check if this is a conflict error
    pub fn is_conflict(&self) -> bool {
        self.kind.is_conflict()
    }
    
    /// Get context value
    pub fn context_value(&self, key: &str) -> Option<&String> {
        self.context.get(key)
    }
    
    /// Format error with full details (for logging)
    pub fn format_full(&self) -> String {
        let mut output = format!("Error: {}\n", self.message);
        output.push_str(&format!("Code: {}\n", self.code()));
        
        if !self.context.is_empty() {
            output.push_str("Context:\n");
            for (key, value) in &self.context {
                output.push_str(&format!("  {}: {}\n", key, value));
            }
        }
        
        if let Some(source) = &self.source {
            output.push_str(&format!("Source: {}\n", source));
        }
        
        #[cfg(feature = "backtrace")]
        if let Some(bt) = &self.backtrace {
            output.push_str(&format!("Backtrace:\n{:?}", bt));
        }
        
        output
    }
}

impl fmt::Display for Error {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.message)
    }
}

impl StdError for Error {
    fn source(&self) -> Option<&(dyn StdError + 'static)> {
        self.source.as_ref().map(|e| e.as_ref() as &(dyn StdError + 'static))
    }
}

impl From<AppError> for Error {
    fn from(kind: AppError) -> Self {
        Error::new(kind)
    }
}

/// Error builder for fluent API
pub struct ErrorBuilder {
    kind: AppError,
    message: Option<String>,
    context: HashMap<String, String>,
}

impl ErrorBuilder {
    pub fn new(kind: AppError) -> Self {
        Self {
            kind,
            message: None,
            context: HashMap::new(),
        }
    }
    
    pub fn message(mut self, msg: impl Into<String>) -> Self {
        self.message = Some(msg.into());
        self
    }
    
    pub fn context(mut self, key: impl Into<String>, value: impl Into<String>) -> Self {
        self.context.insert(key.into(), value.into());
        self
    }
    
    pub fn build(self) -> Error {
        let mut error = match self.message {
            Some(msg) => Error::with_message(self.kind, msg),
            None => Error::new(self.kind),
        };
        error.context = self.context;
        error
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_error_creation() {
        let error = Error::new(AppError::not_found("User", "123"));
        assert!(error.is_not_found());
        assert_eq!(error.code(), "NOT_FOUND");
    }
    
    #[test]
    fn test_error_with_context() {
        let error = Error::new(AppError::validation("email", "Invalid format"))
            .with_context("user_id", "123")
            .with_context("attempt", "3");
        
        assert!(error.is_validation());
        assert_eq!(error.context_value("user_id"), Some(&"123".to_string()));
    }
    
    #[test]
    fn test_error_builder() {
        let error = ErrorBuilder::new(AppError::not_found("Product", "456"))
            .message("Product not found in catalog")
            .context("category", "electronics")
            .build();
        
        assert!(error.is_not_found());
        assert_eq!(error.message, "Product not found in catalog");
        assert_eq!(error.context_value("category"), Some(&"electronics".to_string()));
    }
}
