// core/backend/src/domain/entities/mod.rs
//! Core Domain Entities

use serde::{Deserialize, Serialize};

/// Application configuration entity
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub name: String,
    pub version: String,
}

/// Base entity trait
pub trait Entity: Clone + Send + Sync {
    fn id(&self) -> String;
}
