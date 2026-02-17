// core/backend/src/application/services/mod.rs
//! Application Services

/// Core application service trait
pub trait Service: Send + Sync {
    fn name(&self) -> &str;
    fn initialize(&mut self) -> anyhow::Result<()>;
}
