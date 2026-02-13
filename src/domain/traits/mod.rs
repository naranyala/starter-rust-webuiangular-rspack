use crate::domain::entities::User;
use anyhow::Result;

pub trait UserRepository: Send + Sync {
    fn create(&self, user: &User) -> Result<i64>;
    fn get_by_id(&self, id: i64) -> Result<Option<User>>;
    fn get_all(&self) -> Result<Vec<User>>;
    fn update(&self, user: &User) -> Result<()>;
    fn delete(&self, id: i64) -> Result<()>;
}

pub trait ConfigRepository: Send + Sync {
    fn load_config(&self) -> Result<crate::domain::entities::AppConfig>;
    fn save_config(&self, config: &crate::domain::entities::AppConfig) -> Result<()>;
}
