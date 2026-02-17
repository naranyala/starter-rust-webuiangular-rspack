// core/backend/src/lib.rs
//! Rust WebUI Core Library
//! 
//! Provides the foundational infrastructure for plugin-driven architecture
//! with complete MVVM pattern support.
//! 
//! # Error Handling
//! 
//! This library uses "errors as values" pattern. All fallible operations return
//! `Result<T, AppError>` instead of throwing exceptions.
//! 
//! ```rust
//! use rustwebui_core::prelude::*;
//! 
//! fn my_function() -> Result<User> {
//!     let user = find_user("123")?;  // ? propagates errors
//!     Ok(user)
//! }
//! 
//! // Handle errors explicitly
//! match my_function() {
//!     Ok(user) => println!("Found: {}", user.name),
//!     Err(e) if e.is_not_found() => println!("User not found"),
//!     Err(e) => eprintln!("Error: {}", e),
//! }
//! ```

pub mod domain;
pub mod application;
pub mod infrastructure;
pub mod presentation;
pub mod plugin;
pub mod error;

pub mod prelude {
    //! Commonly used types and traits
    pub use crate::domain::entities::*;
    pub use crate::domain::traits::*;
    pub use crate::application::services::*;
    pub use crate::infrastructure::*;
    pub use crate::plugin::{Plugin, PluginContext, PluginRegistry, PluginMetadata};
    pub use crate::presentation::webui::WebUIBridge;
    
    // Error handling
    pub use crate::error::{
        AppError, Error, Result, ErrorExt, OptionExt,
        DomainError, InfrastructureError, ApplicationError, PluginError,
        ErrorHandler, ErrorResponse,
    };
    
    // Error macros
    pub use crate::{validation_error, not_found_error};
    
    pub use anyhow::Result as AnyhowResult;
    pub use serde::{Deserialize, Serialize};
    pub use std::sync::Arc;
}

/// Core library version
pub const VERSION: &str = env!("CARGO_PKG_VERSION");

/// Initialize core system
pub fn init() -> Result<(), anyhow::Error> {
    log::info!("Rust WebUI Core v{} initialized", VERSION);
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_core_init() {
        assert!(init().is_ok());
    }
}
