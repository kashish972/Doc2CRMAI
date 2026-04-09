import mongoose from "mongoose";
import dns from "node:dns";

// Force reliable public DNS for SRV lookup (fixes querySrv ECONNREFUSED on some systems)
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/doc2crm-ai";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

let cached = global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,
        family: 4, // prefer IPv4, sometimes helps with Node DNS/network issues
      })
      .then((mongooseInstance) => mongooseInstance);
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

export default connectToDatabase;