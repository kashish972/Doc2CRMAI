import { AsyncLocalStorage } from "node:async_hooks";
import type { Connection, Schema } from "mongoose";

interface TenantStore {
  connection: Connection;
}

declare global {
  // eslint-disable-next-line no-var
  var tenantConnectionStorageSingleton: AsyncLocalStorage<TenantStore> | undefined;
  // eslint-disable-next-line no-var
  var lastTenantConnectionFallback: Connection | undefined;
}

const tenantConnectionStorage =
  global.tenantConnectionStorageSingleton || new AsyncLocalStorage<TenantStore>();

if (!global.tenantConnectionStorageSingleton) {
  global.tenantConnectionStorageSingleton = tenantConnectionStorage;
}

export function setCurrentTenantConnection(connection: Connection) {
  global.lastTenantConnectionFallback = connection;
  tenantConnectionStorage.enterWith({ connection });
}

export function getCurrentTenantConnection(): Connection {
  const store = tenantConnectionStorage.getStore();
  const fallbackConnection = global.lastTenantConnectionFallback;

  if (store?.connection) {
    return store.connection;
  }

  // Fallback prevents runtime crashes when async context is lost or duplicated by bundling.
  if (fallbackConnection) {
    return fallbackConnection;
  }

  throw new Error("Tenant database connection is not initialized");
}

export function createTenantModelProxy<T>(modelName: string, schema: Schema) {
  return new Proxy({} as object, {
    get(_target, property) {
      const connection = getCurrentTenantConnection();
      const model = connection.models[modelName] || connection.model(modelName, schema);
      const value = (model as unknown as Record<string | symbol, unknown>)[property];
      return typeof value === "function" ? value.bind(model) : value;
    },
  }) as T;
}
