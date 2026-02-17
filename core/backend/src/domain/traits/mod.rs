// core/backend/src/domain/traits/mod.rs
//! Core Domain Traits

/// Repository trait for data access
pub trait Repository<T>: Send + Sync {
    fn find(&self, id: &str) -> anyhow::Result<Option<T>>;
    fn find_all(&self) -> anyhow::Result<Vec<T>>;
    fn save(&self, entity: T) -> anyhow::Result<T>;
    fn delete(&self, id: &str) -> anyhow::Result<()>;
}
