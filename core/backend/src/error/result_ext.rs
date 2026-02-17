// core/backend/src/error/result_ext.rs
//! Result Extensions - Ergonomic Error Handling
//! 
//! Provides extension traits for Result to make error handling more ergonomic.

use std::fmt::Display;

use super::{AppError, DomainError, Error, InfrastructureError, Result};

/// Extension trait for Result with additional error handling methods
pub trait ResultExt<T, E> {
    /// Add context to the error
    fn context<C>(self, context: C) -> Result<T, Error>
    where
        C: std::fmt::Display + Send + Sync + 'static;
    
    /// Add context using a closure (lazy evaluation)
    fn with_context<C, F>(self, f: F) -> Result<T, Error>
    where
        C: std::fmt::Display + Send + Sync + 'static,
        F: FnOnce() -> C;
    
    /// Map the error type
    fn map_err_context<F, C>(self, f: F) -> Result<T, Error>
    where
        F: FnOnce(E) -> C,
        C: Into<AppError>;
    
    /// Convert error to not found
    fn map_not_found<F>(self, f: F) -> Result<T>
    where
        F: FnOnce() -> String;
    
    /// Convert error to validation error
    fn map_validation<F, M>(self, field: F, message: M) -> Result<T>
    where
        F: Into<String>,
        M: Into<String>;
    
    /// Handle both success and error cases
    fn handle<F, G, R>(self, ok: F, err: G) -> R
    where
        F: FnOnce(T) -> R,
        G: FnOnce(AppError) -> R;
}

impl<T, E> ResultExt<T, E> for std::result::Result<T, E>
where
    E: Into<AppError>,
{
    fn context<C>(self, context: C) -> Result<T, Error>
    where
        C: std::fmt::Display + Send + Sync + 'static,
    {
        self.map_err(|e| {
            Error::with_message(e.into(), format!("{}: {}", context, e))
        })
    }
    
    fn with_context<C, F>(self, f: F) -> Result<T, Error>
    where
        C: std::fmt::Display + Send + Sync + 'static,
        F: FnOnce() -> C,
    {
        self.map_err(|e| {
            let context = f();
            Error::with_message(e.into(), format!("{}: {}", context, e))
        })
    }
    
    fn map_err_context<F, C>(self, f: F) -> Result<T, Error>
    where
        F: FnOnce(E) -> C,
        C: Into<AppError>,
    {
        self.map_err(|e| f(e).into())
    }
    
    fn map_not_found<F>(self, f: F) -> Result<T>
    where
        F: FnOnce() -> String,
    {
        self.map_err(|_| AppError::not_found("Resource", f()))
    }
    
    fn map_validation<F, M>(self, field: F, message: M) -> Result<T>
    where
        F: Into<String>,
        M: Into<String>,
    {
        self.map_err(|_| AppError::validation(field, message))
    }
    
    fn handle<F, G, R>(self, ok: F, err: G) -> R
    where
        F: FnOnce(T) -> R,
        G: FnOnce(AppError) -> R,
    {
        match self {
            Ok(v) => ok(v),
            Err(e) => err(e.into()),
        }
    }
}

/// Extension for Option to convert to Result
pub trait OptionExt<T> {
    /// Convert Option to Result with not found error
    fn ok_or_not_found<E, I>(self, entity: E, id: I) -> Result<T>
    where
        E: Into<String>,
        I: Into<String>;
    
    /// Convert Option to Result with custom error
    fn ok_or_else<E, F>(self, f: F) -> Result<T>
    where
        F: FnOnce() -> E,
        E: Into<AppError>;
}

impl<T> OptionExt<T> for Option<T> {
    fn ok_or_not_found<E, I>(self, entity: E, id: I) -> Result<T>
    where
        E: Into<String>,
        I: Into<String>,
    {
        self.ok_or_else(|| AppError::not_found(entity, id))
    }
    
    fn ok_or_else<E, F>(self, f: F) -> Result<T>
    where
        F: FnOnce() -> E,
        E: Into<AppError>,
    {
        self.ok_or_else(f).map_err(|e| e.into())
    }
}

/// Helper functions for common error patterns
pub mod errors {
    use super::*;
    
    /// Create a validation error result
    pub fn validation<T>(field: impl Into<String>, message: impl Into<String>) -> Result<T> {
        Err(AppError::validation(field, message).into())
    }
    
    /// Create a not found error result
    pub fn not_found<T>(entity: impl Into<String>, id: impl Into<String>) -> Result<T> {
        Err(AppError::not_found(entity, id).into())
    }
    
    /// Create a conflict error result
    pub fn conflict<T>(resource: impl Into<String>, message: impl Into<String>) -> Result<T> {
        Err(AppError::Domain(DomainError::Conflict {
            resource: resource.into(),
            message: message.into(),
        }).into())
    }
    
    /// Create a database error result
    pub fn database<T>(
        operation: impl Into<String>,
        message: impl Into<String>,
    ) -> Result<T> {
        Err(AppError::Infrastructure(InfrastructureError::Database {
            operation: operation.into(),
            message: message.into(),
            source: None,
        }).into())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_result_context() {
        let result: Result<i32> = Err(AppError::validation("age", "Must be positive"));
        let error = result.context("Failed to validate user").unwrap_err();
        assert!(error.is_validation());
    }
    
    #[test]
    fn test_option_ok_or_not_found() {
        let none: Option<i32> = None;
        let result = none.ok_or_not_found("User", "123");
        assert!(result.is_err());
        assert!(result.unwrap_err().is_not_found());
        
        let some = Some(42);
        let result = some.ok_or_not_found("User", "123");
        assert_eq!(result.unwrap(), 42);
    }
    
    #[test]
    fn test_handle() {
        let ok_result: Result<i32> = Ok(42);
        let ok_handled = ok_result.handle(|v| v * 2, |_| 0);
        assert_eq!(ok_handled, 84);
        
        let err_result: Result<i32> = Err(AppError::not_found("Item", "1"));
        let err_handled = err_result.handle(|v| v, |_| -1);
        assert_eq!(err_handled, -1);
    }
    
    #[test]
    fn test_helper_functions() {
        let validation = errors::validation::<()>("email", "Invalid");
        assert!(validation.is_err());
        assert!(validation.unwrap_err().is_validation());
        
        let not_found = errors::not_found::<()>("User", "123");
        assert!(not_found.is_err());
        assert!(not_found.unwrap_err().is_not_found());
    }
}
