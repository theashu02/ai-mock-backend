import mongoose, { Schema } from "mongoose";
import { createClient } from "redis";

let mongoConnection: Promise<typeof mongoose> | null = null;

export async function connectMongo() {
  if (mongoose.connection.readyState >= 1) return;

  mongoConnection ??= mongoose.connect(
    process.env.MONGO_URL ?? "mongodb://localhost:27017/mock_engine",
  );
  await mongoConnection;
  console.log("----- MongoDB connected successfully -----");
}

const BlueprintSchema = new Schema({
  name: { type: String, required: true },
  template: { type: Schema.Types.Mixed, required: true },
  configMap: { type: Schema.Types.Mixed, required: true },
});

const MockRecordSchema = new Schema({
  schemaName: { type: String, required: true },
  payload: { type: Schema.Types.Mixed, required: true },
});

const MockApiSchema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    methods: { type: [String], required: true, default: ["GET"] },
    statusCode: { type: Number, required: true, default: 200 },
    latencyMs: { type: Number, required: true, default: 0 },
    enabled: { type: Boolean, required: true, default: true },
    sampleResponse: { type: Schema.Types.Mixed, required: true },
    config: { type: Schema.Types.Mixed, required: true },
    hitCount: { type: Number, required: true, default: 0 },
    lastHitAt: { type: Date },
  },
  { timestamps: true },
);

export const Blueprint =
  mongoose.models.Blueprint ?? mongoose.model("Blueprint", BlueprintSchema);

export const MockRecord =
  mongoose.models.MockRecord ?? mongoose.model("MockRecord", MockRecordSchema);

export const MockApi =
  mongoose.models.MockApi ?? mongoose.model("MockApi", MockApiSchema);

export const redis = createClient({
  url: process.env.REDIS_URL ?? "redis://localhost:6379",
});

let redisConnection: Promise<unknown> | null = null;
let isRedisErrorListenerRegistered = false;

export async function connectRedis() {
  if (redis.isOpen) return;

  if (!isRedisErrorListenerRegistered) {
    redis.on("error", (err) => console.error("Redis Client Error", err));
    isRedisErrorListenerRegistered = true;
  }

  redisConnection ??= redis.connect().catch((error) => {
    redisConnection = null;
    throw error;
  });
  await redisConnection;
  console.log("----- Redis connected successfully -----");
}
