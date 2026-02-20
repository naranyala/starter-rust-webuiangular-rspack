#![allow(dead_code)]
// src/core/infrastructure/database/models.rs
// Database data structures and models

use serde::{Deserialize, Serialize};

/// Represents a database row as a dynamic JSON-like object
pub type DbRow = serde_json::Map<String, serde_json::Value>;

/// Result wrapper for database operations
#[derive(Debug, Serialize)]
pub struct QueryResult {
    pub success: bool,
    pub data: Vec<DbRow>,
    pub message: String,
    pub rows_affected: usize,
}

impl QueryResult {
    pub fn success(data: Vec<DbRow>, message: &str) -> Self {
        Self {
            success: true,
            data,
            message: message.to_string(),
            rows_affected: 0,
        }
    }

    pub fn with_rows_affected(mut self, count: usize) -> Self {
        self.rows_affected = count;
        self
    }
}

/// User record structure
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct User {
    pub id: i64,
    pub name: String,
    pub email: String,
    pub role: String,
    pub status: String,
    pub created_at: String,
}

impl User {
    pub fn new(
        id: i64,
        name: &str,
        email: &str,
        role: &str,
        status: &str,
        created_at: &str,
    ) -> Self {
        Self {
            id,
            name: name.to_string(),
            email: email.to_string(),
            role: role.to_string(),
            status: status.to_string(),
            created_at: created_at.to_string(),
        }
    }
}

/// Product record structure
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Product {
    pub id: i64,
    pub name: String,
    pub description: Option<String>,
    pub price: f64,
    pub category: String,
    pub stock: i64,
}
