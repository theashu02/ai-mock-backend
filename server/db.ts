import { createClient } from "redis";

export const redis = createClient({ url: "redis://localhost:6379" });

let isRedisConnected = false;
export async function connectRedis() {
  if (isRedisConnected) return;
  
  redis.on('error', (err) => console.log('Redis Client Error', err));
  
  await redis.connect();
  isRedisConnected = true;
  console.log("----- Redis connected successfully -----");
}
