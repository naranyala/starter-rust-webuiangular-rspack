// src/core/infrastructure/database/mod.rs
// Database module - SQLite with connection pooling

pub mod connection;
pub mod models;
pub mod users;

pub use connection::Database;
