#![allow(dead_code)]
use std::any::{Any, TypeId};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};

use crate::core::error::{AppError, AppResult, ErrorValue, ErrorCode, ToAppResult};

pub struct Container {
    services: Mutex<HashMap<TypeId, Arc<dyn Any + Send + Sync>>>,
}

impl Container {
    pub fn new() -> Self {
        Self {
            services: Mutex::new(HashMap::new()),
        }
    }

    pub fn register<T: 'static + Send + Sync>(&self, instance: T) -> AppResult<()> {
        let type_id = TypeId::of::<T>();
        let mut services = self
            .services
            .lock()
            .map_err(|e| {
                AppError::LockPoisoned(
                    ErrorValue::new(ErrorCode::LockPoisoned, "Failed to acquire DI container lock")
                        .with_cause(e.to_string())
                        .with_context("operation", "register")
                )
            })?;
        services.insert(type_id, Arc::new(instance));
        Ok(())
    }

    pub fn register_singleton<T>(&self, service: T) -> AppResult<()>
    where
        T: Send + Sync + 'static,
    {
        self.register(service)
    }

    pub fn resolve<T: 'static + Clone>(&self) -> AppResult<T> {
        let type_id = TypeId::of::<T>();
        let services = self
            .services
            .lock()
            .map_err(|e| {
                AppError::LockPoisoned(
                    ErrorValue::new(ErrorCode::LockPoisoned, "Failed to acquire DI container lock")
                        .with_cause(e.to_string())
                        .with_context("operation", "resolve")
                )
            })?;

        services
            .get(&type_id)
            .and_then(|service| service.downcast_ref::<T>().cloned())
            .to_app_error(&format!(
                "Service {} not found in container",
                std::any::type_name::<T>()
            ))
    }

    pub fn resolve_arc<T: 'static + Send + Sync>(&self) -> AppResult<Arc<T>> {
        let type_id = TypeId::of::<T>();
        let services = self
            .services
            .lock()
            .map_err(|e| {
                AppError::LockPoisoned(
                    ErrorValue::new(ErrorCode::LockPoisoned, "Failed to acquire DI container lock")
                        .with_cause(e.to_string())
                        .with_context("operation", "resolve_arc")
                )
            })?;

        services
            .get(&type_id)
            .and_then(|service| service.clone().downcast::<T>().ok())
            .to_app_error(&format!(
                "Service {} not found in container",
                std::any::type_name::<T>()
            ))
    }

    pub fn has<T: 'static>(&self) -> AppResult<bool> {
        let type_id = TypeId::of::<T>();
        let services = self
            .services
            .lock()
            .map_err(|e| {
                AppError::LockPoisoned(
                    ErrorValue::new(ErrorCode::LockPoisoned, "Failed to acquire DI container lock")
                        .with_cause(e.to_string())
                        .with_context("operation", "has")
                )
            })?;
        Ok(services.contains_key(&type_id))
    }
}

impl Default for Container {
    fn default() -> Self {
        Self::new()
    }
}

use std::sync::OnceLock;

static GLOBAL_CONTAINER: OnceLock<Container> = OnceLock::new();

pub fn get_container() -> &'static Container {
    GLOBAL_CONTAINER.get_or_init(|| Container::new())
}

pub fn init_container() -> AppResult<()> {
    use crate::core::infrastructure::logging;
    get_container().register(logging::Logger::new())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_container_register_and_resolve() {
        let container = Container::new();
        container
            .register(42i32)
            .expect("Failed to register service");

        assert_eq!(container.resolve::<i32>().expect("Failed to resolve"), 42);
    }

    #[test]
    fn test_singleton_registration() {
        let container = Container::new();
        let service = String::from("test");
        container
            .register_singleton(service)
            .expect("Failed to register");

        let resolved: Arc<String> = container.resolve_arc().expect("Failed to resolve");
        assert_eq!(*resolved, "test");
    }
}
