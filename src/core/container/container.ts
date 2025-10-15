/**
 * Simple Dependency Injection Container
 * Following the Dependency Inversion Principle (SOLID)
 */

type Constructor<T = unknown> = new (...args: unknown[]) => T;
type Factory<T = unknown> = () => T;

class Container {
  private static instance: Container;
  private services: Map<string, unknown> = new Map();
  private factories: Map<string, Factory> = new Map();

  private constructor() {}

  static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  /**
   * Register a singleton service
   */
  register<T>(key: string, service: T): void {
    this.services.set(key, service);
  }

  /**
   * Register a factory function
   */
  registerFactory<T>(key: string, factory: Factory<T>): void {
    this.factories.set(key, factory);
  }

  /**
   * Resolve a service by key
   */
  resolve<T>(key: string): T {
    // Check if singleton exists
    if (this.services.has(key)) {
      return this.services.get(key) as T;
    }

    // Check if factory exists and create instance
    if (this.factories.has(key)) {
      const factory = this.factories.get(key) as Factory<T>;
      const instance = factory();
      this.services.set(key, instance); // Cache as singleton
      return instance;
    }

    throw new Error(`Service '${key}' not found in container`);
  }

  /**
   * Check if a service is registered
   */
  has(key: string): boolean {
    return this.services.has(key) || this.factories.has(key);
  }

  /**
   * Clear all services (useful for testing)
   */
  clear(): void {
    this.services.clear();
    this.factories.clear();
  }

  /**
   * Auto-register a class with its dependencies
   */
  autoRegister<T>(
    key: string,
    constructor: Constructor<T>,
    ...deps: string[]
  ): void {
    this.registerFactory(key, () => {
      const resolvedDeps = deps.map((dep) => this.resolve(dep));
      return new constructor(...resolvedDeps);
    });
  }
}

export default Container.getInstance();
