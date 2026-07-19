import mongoose, { Schema } from "mongoose";
import { createClient } from "redis";

// ─── Mongoose ────────────────────────────────────────────────────────────────

export async function connectMongo() {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect("mongodb://localhost:27017/mock_engine");
  console.log("----- MongoDB connected successfully -----");
}

const BlueprintSchema = new Schema({
  name: { type: String, required: true },
  template: { type: Schema.Types.Mixed, required: true },
  configMap: { type: Schema.Types.Mixed, required: true }, // Store the compiled map
});

const MockRecordSchema = new Schema({
  schemaName: { type: String, required: true },
  payload: { type: Schema.Types.Mixed, required: true },
});

export const Blueprint =
  mongoose.models.Blueprint ?? mongoose.model("Blueprint", BlueprintSchema);

export const MockRecord =
  mongoose.models.MockRecord ?? mongoose.model("MockRecord", MockRecordSchema);

// ─── Redis ───────────────────────────────────────────────────────────────────

export const redis = createClient({ url: "redis://localhost:6379" });

let isRedisConnected = false;
export async function connectRedis() {
  if (isRedisConnected) return;
  
  // Catch initial connection errors so app doesn't crash on boot if redis is missing
  redis.on('error', (err) => console.log('Redis Client Error', err));
  
  await redis.connect();
  isRedisConnected = true;
  console.log("----- Redis connected successfully -----");
}
