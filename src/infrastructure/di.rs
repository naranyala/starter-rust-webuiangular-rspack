use std::any::{Any, TypeId};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};

pub struct Container {
    services: Mutex<HashMap<TypeId, Arc<dyn Any + Send + Sync>>>,
}

impl Container {
    pub fn new() -> Self {
        Self {
            services: Mutex::new(HashMap::new()),
        }
    }

    pub fn register<T: 'static + Send + Sync>(&self, instance: T) {
        let type_id = TypeId::of::<T>();
        let mut services = self.services.lock().unwrap();
        services.insert(type_id, Arc::new(instance));
    }

    pub fn register_singleton<T>(&self, service: T)
    where
        T: Send + Sync + 'static,
    {
        self.register(service);
    }

    pub fn resolve<T: 'static + Clone>(&self) -> Option<T> {
        let type_id = TypeId::of::<T>();
        let services = self.services.lock().unwrap();

        services
            .get(&type_id)
            .and_then(|service| service.downcast_ref::<T>().cloned())
    }

    pub fn resolve_arc<T: 'static + Send + Sync>(&self) -> Option<Arc<T>> {
        let type_id = TypeId::of::<T>();
        let services = self.services.lock().unwrap();

        services
            .get(&type_id)
            .and_then(|service| service.clone().downcast::<T>().ok())
    }

    pub fn has<T: 'static>(&self) -> bool {
        let type_id = TypeId::of::<T>();
        let services = self.services.lock().unwrap();
        services.contains_key(&type_id)
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

pub fn init_container() {
    use crate::infrastructure::logging;
    get_container().register(logging::Logger::new());
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_container_register_and_resolve() {
        let container = Container::new();
        container.register(42i32);

        assert_eq!(container.resolve::<i32>(), Some(42));
    }

    #[test]
    fn test_singleton_registration() {
        let container = Container::new();
        let service = String::from("test");
        container.register_singleton(service);

        let resolved: Option<Arc<String>> = container.resolve_arc();
        assert!(resolved.is_some());
        assert_eq!(*resolved.unwrap(), "test");
    }
}
