interface ServiceDefinition {
  definition: Function | Object;
  singleton: boolean;
  dependencies: string[];
}

interface ServiceInstance {
  [key: string]: any;
}

class Container {
  private services: Map<string, ServiceDefinition>;
  private singletons: Map<string, ServiceInstance>;

  constructor() {
    this.services = new Map();
    this.singletons = new Map();
  }

  register(name: string, definition: Function | Object, options: {
    singleton?: boolean;
    dependencies?: string[];
  } = {}): Container {
    const config = {
      singleton: true,
      dependencies: [],
      ...options,
    };

    this.services.set(name, {
      definition,
      ...config,
    });

    return this;
  }

  registerInstance(name: string, instance: ServiceInstance): Container {
    this.singletons.set(name, instance);
    return this;
  }

  resolve<T = any>(name: string): T {
    if (this.singletons.has(name)) {
      return this.singletons.get(name) as T;
    }

    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Service '${name}' not found in container`);
    }

    const dependencies = service.dependencies.map((depName) => this.resolve(depName));

    let instance: any;
    if (typeof service.definition === 'function') {
      if (service.definition.prototype?.constructor) {
        instance = new (service.definition as any)(...dependencies);
      } else {
        instance = (service.definition as Function)(...dependencies);
      }
    } else {
      instance = service.definition;
    }

    if (service.singleton) {
      this.singletons.set(name, instance);
    }

    return instance as T;
  }

  has(name: string): boolean {
    return this.services.has(name) || this.singletons.has(name);
  }

  clear(): void {
    this.services.clear();
    this.singletons.clear();
  }

  createChild(): Container {
    const child = new Container();
    (child as any).parent = this;
    return child;
  }
}

const globalContainer = new Container();

export function container(): Container {
  return globalContainer;
}

export function inject(dependencies: string[]) {
  return (target: any) => {
    target._injectDependencies = dependencies;
    return target;
  };
}

export function singleton<T>(name: string, definition: Function, options: any = {}): T {
  container().register(name, definition, { ...options, singleton: true });
  return container().resolve<T>(name);
}

export function transient(name: string, definition: Function, options: any = {}): void {
  container().register(name, definition, { ...options, singleton: false });
}

export { Container };
export default globalContainer;