import { Elysia, t } from "elysia";
import { connectRedis, redis } from "./db";

connectRedis().catch(console.error);

export const app = new Elysia({ prefix: "/api" })
  .get("/", () => "Welcome to AI Mock Backend API")
  .get('/health', () => ({ status: 'ok', timestamp: new Date().toISOString() }))
  .post('/generate', ({ body }) => {
    return {
      success: true,
      message: 'AI Mock generated successfully',
      promptReceived: body.prompt
    }
  }, {
    body: t.Object({
      prompt: t.String()
    })
  })
  
  .post("/schema/:name", async ({ params, body }) => {
    const key = `schema:${params.name}`;
    // Storing the schema as a JSON string in Redis
    await redis.set(key, JSON.stringify(body));
    
    return { ok: true, schema: body };
  })

  .post("/generate/:name", async ({ params }) => {
    const key = `schema:${params.name}`;
    const blueprintStr = await redis.get(key);
    
    if (!blueprintStr) {
      return new Response(
        JSON.stringify({ ok: false, message: "Blueprint not found in Redis" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const blueprint = JSON.parse(blueprintStr);

    // TODO: replace with actual AI-driven generation
    const generatedPayload = blueprint; 

    // We only return it, no need to store the generated records if we are just using it temporarily.
    return { ok: true, record: generatedPayload };
  });

export type App = typeof app;
