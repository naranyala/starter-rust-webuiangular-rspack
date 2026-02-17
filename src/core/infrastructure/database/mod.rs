// src/core/infrastructure/database/mod.rs
// Database module - SQLite integration with raw query support

pub mod connection;
pub mod models;
pub mod users;

pub use connection::Database;
pub use models::{DbRow, Product, QueryResult, User};
