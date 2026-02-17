// core/backend/src/error/kinds.rs
//! Error Kinds - Hierarchical Error Types
//! 
//! Defines the error hierarchy for the application.

use std::fmt;
use std::error::Error as StdError;

/// Application error hierarchy
#[derive(Debug)]
pub enum AppError {
    /// Domain layer errors (business logic)
    Domain(DomainError),
    /// Infrastructure layer errors (external systems)
    Infrastructure(InfrastructureError),
    /// Application layer errors (use cases)
    Application(ApplicationError),
    /// Plugin system errors
    Plugin(PluginError),
}

/// Domain errors - business logic violations
#[derive(Debug)]
pub enum DomainError {
    /// Entity not found
    NotFound {
        entity: String,
        id: String,
    },
    /// Validation failed
    Validation {
        field: String,
        message: String,
        value: Option<String>,
    },
    /// Business rule violation
    BusinessRule {
        rule: String,
        message: String,
    },
    /// Conflict (e.g., unique constraint)
    Conflict {
        resource: String,
        message: String,
    },
}

/// Infrastructure errors - external system failures
#[derive(Debug)]
pub enum InfrastructureError {
    /// Database error
    Database {
        operation: String,
        message: String,
        source: Option<String>,
    },
    /// File system error
    FileSystem {
        path: String,
        operation: String,
        message: String,
    },
    /// Network error
    Network {
        url: String,
        message: String,
        status: Option<u16>,
    },
    /// Serialization error
    Serialization {
        format: String,
        message: String,
    },
}

/// Application errors - use case failures
#[derive(Debug)]
pub enum ApplicationError {
    /// Invalid state
    InvalidState {
        state: String,
        expected: String,
    },
    /// Operation timeout
    Timeout {
        operation: String,
        timeout_ms: u64,
    },
    /// Operation canceled
    Canceled {
        operation: String,
        reason: String,
    },
    /// Internal error (should not happen)
    Internal {
        message: String,
    },
}

/// Plugin errors
#[derive(Debug)]
pub enum PluginError {
    /// Plugin not found
    NotFound {
        plugin_id: String,
    },
    /// Failed to load plugin
    LoadFailed {
        plugin_id: String,
        message: String,
    },
    /// Failed to initialize plugin
    InitFailed {
        plugin_id: String,
        message: String,
    },
    /// Plugin dependency missing
    DependencyMissing {
        plugin_id: String,
        dependency: String,
    },
}

// ============ Implementations ============

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            AppError::Domain(e) => write!(f, "Domain error: {}", e),
            AppError::Infrastructure(e) => write!(f, "Infrastructure error: {}", e),
            AppError::Application(e) => write!(f, "Application error: {}", e),
            AppError::Plugin(e) => write!(f, "Plugin error: {}", e),
        }
    }
}

impl StdError for AppError {
    fn source(&self) -> Option<&(dyn StdError + 'static)> {
        None
    }
}

impl fmt::Display for DomainError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            DomainError::NotFound { entity, id } => {
                write!(f, "{} not found: {}", entity, id)
            }
            DomainError::Validation { field, message, value } => {
                write!(f, "Validation failed for '{}': {}", field, message)?;
                if let Some(v) = value {
                    write!(f, " (value: {})", v)?;
                }
                Ok(())
            }
            DomainError::BusinessRule { rule, message } => {
                write!(f, "Business rule '{}' violated: {}", rule, message)
            }
            DomainError::Conflict { resource, message } => {
                write!(f, "Conflict on '{}': {}", resource, message)
            }
        }
    }
}

impl fmt::Display for InfrastructureError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            InfrastructureError::Database { operation, message, source } => {
                write!(f, "Database {} failed: {}", operation, message)?;
                if let Some(s) = source {
                    write!(f, " ({})", s)?;
                }
                Ok(())
            }
            InfrastructureError::FileSystem { path, operation, message } => {
                write!(f, "File system {} on '{}' failed: {}", operation, path, message)
            }
            InfrastructureError::Network { url, message, status } => {
                write!(f, "Network request to '{}' failed: {}", url, message)?;
                if let Some(s) = status {
                    write!(f, " (status: {})", s)?;
                }
                Ok(())
            }
            InfrastructureError::Serialization { format, message } => {
                write!(f, "{} serialization failed: {}", format, message)
            }
        }
    }
}

impl fmt::Display for ApplicationError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ApplicationError::InvalidState { state, expected } => {
                write!(f, "Invalid state: got '{}', expected '{}'", state, expected)
            }
            ApplicationError::Timeout { operation, timeout_ms } => {
                write!(f, "Operation '{}' timed out after {}ms", operation, timeout_ms)
            }
            ApplicationError::Canceled { operation, reason } => {
                write!(f, "Operation '{}' canceled: {}", operation, reason)
            }
            ApplicationError::Internal { message } => {
                write!(f, "Internal error: {}", message)
            }
        }
    }
}

impl fmt::Display for PluginError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            PluginError::NotFound { plugin_id } => {
                write!(f, "Plugin not found: {}", plugin_id)
            }
            PluginError::LoadFailed { plugin_id, message } => {
                write!(f, "Failed to load plugin '{}': {}", plugin_id, message)
            }
            PluginError::InitFailed { plugin_id, message } => {
                write!(f, "Failed to initialize plugin '{}': {}", plugin_id, message)
            }
            PluginError::DependencyMissing { plugin_id, dependency } => {
                write!(f, "Plugin '{}' missing dependency: {}", plugin_id, dependency)
            }
        }
    }
}

// ============ Helper Methods ============

impl AppError {
    /// Check if this is a not found error
    pub fn is_not_found(&self) -> bool {
        matches!(self, AppError::Domain(DomainError::NotFound { .. }))
    }
    
    /// Check if this is a validation error
    pub fn is_validation(&self) -> bool {
        matches!(self, AppError::Domain(DomainError::Validation { .. }))
    }
    
    /// Check if this is a conflict error
    pub fn is_conflict(&self) -> bool {
        matches!(self, AppError::Domain(DomainError::Conflict { .. }))
    }
    
    /// Check if this is a database error
    pub fn is_database(&self) -> bool {
        matches!(self, AppError::Infrastructure(InfrastructureError::Database { .. }))
    }
    
    /// Check if this is a timeout error
    pub fn is_timeout(&self) -> bool {
        matches!(self, AppError::Application(ApplicationError::Timeout { .. }))
    }
    
    /// Check if this is an internal error
    pub fn is_internal(&self) -> bool {
        matches!(self, AppError::Application(ApplicationError::Internal { .. }))
    }
    
    /// Get error code for API responses
    pub fn code(&self) -> &'static str {
        match self {
            AppError::Domain(e) => match e {
                DomainError::NotFound { .. } => "NOT_FOUND",
                DomainError::Validation { .. } => "VALIDATION_ERROR",
                DomainError::BusinessRule { .. } => "BUSINESS_RULE_VIOLATION",
                DomainError::Conflict { .. } => "CONFLICT",
            },
            AppError::Infrastructure(e) => match e {
                InfrastructureError::Database { .. } => "DATABASE_ERROR",
                InfrastructureError::FileSystem { .. } => "FILE_SYSTEM_ERROR",
                InfrastructureError::Network { .. } => "NETWORK_ERROR",
                InfrastructureError::Serialization { .. } => "SERIALIZATION_ERROR",
            },
            AppError::Application(e) => match e {
                ApplicationError::InvalidState { .. } => "INVALID_STATE",
                ApplicationError::Timeout { .. } => "TIMEOUT",
                ApplicationError::Canceled { .. } => "CANCELED",
                ApplicationError::Internal { .. } => "INTERNAL_ERROR",
            },
            AppError::Plugin(e) => match e {
                PluginError::NotFound { .. } => "PLUGIN_NOT_FOUND",
                PluginError::LoadFailed { .. } => "PLUGIN_LOAD_FAILED",
                PluginError::InitFailed { .. } => "PLUGIN_INIT_FAILED",
                PluginError::DependencyMissing { .. } => "PLUGIN_DEPENDENCY_MISSING",
            },
        }
    }
}

// ============ Convenience Constructors ============

impl DomainError {
    pub fn not_found(entity: impl Into<String>, id: impl Into<String>) -> Self {
        DomainError::NotFound {
            entity: entity.into(),
            id: id.into(),
        }
    }
    
    pub fn validation(field: impl Into<String>, message: impl Into<String>) -> Self {
        DomainError::Validation {
            field: field.into(),
            message: message.into(),
            value: None,
        }
    }
    
    pub fn validation_with_value(
        field: impl Into<String>,
        message: impl Into<String>,
        value: impl Into<String>,
    ) -> Self {
        DomainError::Validation {
            field: field.into(),
            message: message.into(),
            value: Some(value.into()),
        }
    }
    
    pub fn business_rule(rule: impl Into<String>, message: impl Into<String>) -> Self {
        DomainError::BusinessRule {
            rule: rule.into(),
            message: message.into(),
        }
    }
    
    pub fn conflict(resource: impl Into<String>, message: impl Into<String>) -> Self {
        DomainError::Conflict {
            resource: resource.into(),
            message: message.into(),
        }
    }
}

impl AppError {
    pub fn not_found(entity: impl Into<String>, id: impl Into<String>) -> Self {
        AppError::Domain(DomainError::not_found(entity, id))
    }
    
    pub fn validation(field: impl Into<String>, message: impl Into<String>) -> Self {
        AppError::Domain(DomainError::validation(field, message))
    }
    
    pub fn business_rule(rule: impl Into<String>, message: impl Into<String>) -> Self {
        AppError::Domain(DomainError::business_rule(rule, message))
    }
}
