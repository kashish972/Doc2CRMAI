import mongoose from "mongoose";
import dns from "node:dns";
import { getSession } from "@/server/auth/session";
import { PlatformTenantModel } from "@/server/models/platform";
import { setCurrentTenantConnection } from "./models/tenant-runtime";

const configuredDnsServers = (process.env.MONGODB_DNS_SERVERS || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

if (configuredDnsServers.length > 0) {
  dns.setServers(configuredDnsServers);
}

dns.setDefaultResultOrder("ipv4first");
const PLATFORM_DB_NAME = "doc2crm_platform";
const DEFAULT_APP_DB_NAME = "doc2crm-ai";

const primaryMongoUri = process.env.MONGODB_URI || `mongodb://localhost:27017/${DEFAULT_APP_DB_NAME}`;
const noSrvMongoUri = process.env.MONGODB_URI_NO_SRV || "";

interface ConnectionCacheEntry {
  conn: mongoose.Connection | null;
  promise: Promise<mongoose.Connection> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var platformMongooseCache: ConnectionCacheEntry | undefined;
  // eslint-disable-next-line no-var
  var tenantMongooseCaches: Map<string, ConnectionCacheEntry> | undefined;
}

function getTenantCacheMap() {
  if (!global.tenantMongooseCaches) {
    global.tenantMongooseCaches = new Map<string, ConnectionCacheEntry>();
  }

  return global.tenantMongooseCaches;
}

function getPlatformCache(): ConnectionCacheEntry {
  if (!global.platformMongooseCache) {
    global.platformMongooseCache = { conn: null, promise: null };
  }

  return global.platformMongooseCache;
}

function buildMongoUriWithDb(baseUri: string, dbName: string): string {
  const [uriWithoutQuery, query] = baseUri.split("?", 2);
  const protocolIndex = uriWithoutQuery.indexOf("://");
  const pathStart = uriWithoutQuery.indexOf("/", protocolIndex + 3);

  const authority = pathStart === -1 ? uriWithoutQuery : uriWithoutQuery.slice(0, pathStart);
  const uriWithDb = `${authority}/${dbName}`;

  return query ? `${uriWithDb}?${query}` : uriWithDb;
}

function isSrvDnsError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return error.message.includes("querySrv") && error.message.includes("ECONNREFUSED");
}

function getMongoUriCandidates(dbName: string): string[] {
  const candidates = [buildMongoUriWithDb(primaryMongoUri, dbName)];

  if (noSrvMongoUri) {
    candidates.push(buildMongoUriWithDb(noSrvMongoUri, dbName));
  }

  return candidates;
}

async function connectWithCache(dbName: string, cache: ConnectionCacheEntry): Promise<mongoose.Connection> {
  if (cache.conn) {
    return cache.conn;
  }

  if (!cache.promise) {
    cache.promise = (async () => {
      const uriCandidates = getMongoUriCandidates(dbName);
      let lastError: unknown;

      for (const uri of uriCandidates) {
        try {
          const connection = await mongoose.createConnection(uri, {
            bufferCommands: false,
          }).asPromise();
          return connection;
        } catch (error) {
          lastError = error;

          // Retry with non-SRV URI when SRV DNS resolution fails.
          if (!isSrvDnsError(error)) {
            break;
          }
        }
      }

      throw lastError;
    })();
  }

  try {
    cache.conn = await cache.promise;
  } catch (error) {
    cache.promise = null;
    throw error;
  }

  return cache.conn;
}

export async function connectToPlatformDatabase(): Promise<mongoose.Connection> {
  const cache = getPlatformCache();

  if (cache.conn) {
    return cache.conn;
  }

  if (!cache.promise) {
    cache.promise = (async () => {
      const uriCandidates = getMongoUriCandidates(PLATFORM_DB_NAME);
      let lastError: unknown;

      for (const uri of uriCandidates) {
        try {
          await mongoose.connect(uri, {
            bufferCommands: false,
          });
          return mongoose.connection;
        } catch (error) {
          lastError = error;

          if (!isSrvDnsError(error)) {
            break;
          }
        }
      }

      throw lastError;
    })();
  }

  try {
    cache.conn = await cache.promise;
  } catch (error) {
    cache.promise = null;
    throw error;
  }

  return cache.conn;
}

export async function connectToTenantDatabase(): Promise<mongoose.Connection> {
  const session = await getSession();

  if (!session) {
    throw new Error("Unauthorized");
  }

  await connectToPlatformDatabase();
  const tenant = await PlatformTenantModel.findById(session.tenantId);

  if (!tenant) {
    throw new Error("Tenant not found");
  }

  const tenantDbName = tenant.dbName || `${DEFAULT_APP_DB_NAME}_${tenant.slug}`;
  const tenantCaches = getTenantCacheMap();
  const tenantCache = tenantCaches.get(tenantDbName) || { conn: null, promise: null };
  tenantCaches.set(tenantDbName, tenantCache);

  const connection = await connectWithCache(tenantDbName, tenantCache);
  setCurrentTenantConnection(connection);
  return connection;
}

export async function connectToDatabase(): Promise<mongoose.Connection> {
  return connectToTenantDatabase();
}

export function buildTenantDbName(slug: string): string {
  const safeSlug = slug.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const uniqueSuffix = Math.random().toString(36).slice(2, 8);
  return `${DEFAULT_APP_DB_NAME}_${safeSlug}_${uniqueSuffix}`;
}

export function getBaseMongoUri() {
  return primaryMongoUri;
}
