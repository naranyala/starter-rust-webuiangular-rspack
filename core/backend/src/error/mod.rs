// core/backend/src/error/mod.rs
//! Error Handling - Errors as Values
//! 
//! This module provides a comprehensive error handling system based on
//! the "errors as values" pattern. Errors are regular values that must
//! be explicitly handled, not exceptions.
//! 
//! # Usage
//! 
//! ```rust
//! use rustwebui_core::error::{Result, AppError, ErrorExt};
//! 
//! fn my_function() -> Result<User> {
//!     let user = find_user("123")?;  // ? operator propagates errors
//!     Ok(user)
//! }
//! 
//! // Handle errors explicitly
//! match my_function() {
//!     Ok(user) => println!("Found: {}", user.name),
//!     Err(e) => {
//!         if e.is_not_found() {
//!             println!("User not found");
//!         } else {
//!             eprintln!("Error: {}", e);
//!         }
//!     }
//! }
//! ```

mod kinds;
mod error;
mod result_ext;
mod handler;

pub use kinds::*;
pub use error::*;
pub use result_ext::*;
pub use handler::*;

/// Core result type for the application
pub type Result<T, E = AppError> = std::result::Result<T, E>;

/// Convert anyhow errors to AppError
impl From<anyhow::Error> for AppError {
    fn from(err: anyhow::Error) -> Self {
        AppError::Application(ApplicationError::Internal {
            message: err.to_string(),
        })
    }
}
