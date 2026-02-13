use crate::domain::entities::User;
use anyhow::Result;
use chrono::Utc;

pub struct UserService;

impl UserService {
    pub fn create_user(name: String, email: String) -> Result<User> {
        let user = User {
            id: None,
            name,
            email,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        // Here you would use the repository to save
        Ok(user)
    }

    pub fn validate_user(user: &User) -> Result<()> {
        if user.name.is_empty() {
            return Err(anyhow::anyhow!("User name cannot be empty"));
        }

        if user.email.is_empty() {
            return Err(anyhow::anyhow!("User email cannot be empty"));
        }

        Ok(())
    }
}
