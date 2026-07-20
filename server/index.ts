import { Elysia, t } from "elysia";
import { connectMongo, connectRedis, redis, Blueprint, MockRecord } from "./db";
import { analyzeSchema } from "../ai-engine/agent";
import { generate } from "../ai-engine/generator";
import { generateSchemaFromAI } from "../ai-engine/schema-converter";
import {
  createMockApi,
  deleteMockApi,
  listMockApis,
  previewMockApi,
} from "./mock-api-service";

async function ensurePersistence() {
  await Promise.all([connectMongo(), connectRedis()]);
}

export const app = new Elysia({ prefix: "/api" })
  .get("/", () => "Welcome to AI Mock Backend API")
  .get("/health", () => ({ status: "ok", timestamp: new Date().toISOString() }))

  .get("/mock-apis", async ({ request }) => {
    const origin = new URL(request.url).origin;
    return { ok: true, apis: await listMockApis(origin) };
  })

  .post(
    "/mock-apis",
    async ({ body }) => {
      const api = await createMockApi(body);
      return { ok: true, api };
    },
    {
      body: t.Object({
        name: t.String(),
        path: t.String(),
        methods: t.Array(t.String()),
        rawJson: t.String(),
        statusCode: t.Optional(t.Number()),
        latencyMs: t.Optional(t.Number()),
      }),
    },
  )

  .post("/mock-apis/:id/preview", async ({ params }) => {
    const preview = await previewMockApi(params.id);
    if (!preview) {
      return new Response(JSON.stringify({ ok: false, message: "Mock API not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return { ok: true, preview };
  })

  .delete("/mock-apis/:id", async ({ params }) => {
    const deleted = await deleteMockApi(params.id);
    if (!deleted) {
      return new Response(JSON.stringify({ ok: false, message: "Mock API not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return { ok: true };
  })
  
  // Test endpoint for the UI button
  .post(
    "/generate",
    ({ body }) => {
      return {
        success: true,
        message: "AI Mock generated successfully",
        promptReceived: body.prompt,
      };
    },
    {
      body: t.Object({
        prompt: t.String(),
      }),
    }
  )

  // ─── POST /schema/convert ──────────────────────────────────────────────────
  .post(
    "/schema/convert",
    async ({ body }) => {
      const result = await generateSchemaFromAI(body.rawJson, body.format);
      
      if (!result.success) {
        return new Response(JSON.stringify({ ok: false, message: result.error }), {
          status: result.statusCode,
          headers: { "Content-Type": "application/json" },
        });
      }
      
      return { ok: true, schema: result.data, meta: result.meta };
    },
    {
      body: t.Object({
        rawJson: t.String(),
        format: t.String(),
      }),
    }
  )

  // ─── POST /schema/:name ────────────────────────────────────────────────────
  .post("/schema/:name", async ({ params, body }) => {
    await ensurePersistence();

    // 1. Compile the arbitrary JSON schema into a generator map via LangGraph agent
    const configMap = await analyzeSchema(body);

    // 2. Save both original schema and compiled map to MongoDB
    const doc = await Blueprint.findOneAndUpdate(
      { name: params.name },
      { name: params.name, template: body, configMap },
      { upsert: true, new: true }
    );

    // 3. Cache the compiled map in Redis
    const key = `schema:${params.name}`;
    await redis.set(key, JSON.stringify(configMap));

    return { ok: true, schema: doc };
  })

  // ─── POST /generate/:name ──────────────────────────────────────────────────
  .post("/generate/:name", async ({ params }) => {
    await ensurePersistence();

    const key = `schema:${params.name}`;
    const configMapStr = await redis.get(key);
    let configMap;

    // 1. Fetch compiled map from Redis (fallback to Mongo)
    if (configMapStr) {
      configMap = JSON.parse(configMapStr);
    } else {
      const blueprint = await Blueprint.findOne({ name: params.name });
      if (!blueprint) {
        return new Response(
          JSON.stringify({ ok: false, message: "Blueprint not found" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }
      configMap = blueprint.configMap;
      // Re-cache in Redis
      await redis.set(key, JSON.stringify(configMap));
    }

    // 2. Generate mock data synchronously without LLM
    const generatedPayload = generate(configMap);

    // 3. Save to MongoDB MockRecord collection
    const record = await MockRecord.create({
      schemaName: params.name,
      payload: generatedPayload,
    });

    // 4. Cache instance in Redis with UUID
    const instanceId = crypto.randomUUID();
    await redis.setEx(`mock:${instanceId}`, 3600, JSON.stringify(generatedPayload)); // Cache for 1 hour

    // 5. Return payload and record ID
    return { 
      ok: true, 
      recordId: record._id.toString(),
      instanceId,
      record: generatedPayload 
    };
  });

export type App = typeof app;
