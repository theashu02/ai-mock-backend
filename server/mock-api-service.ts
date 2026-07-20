import {
  compileMockConfig,
  generateMockData,
  normalizeMethods,
  normalizeMockPath,
  parseJsonResponse,
  type MockConfigNode,
  type MockMethod,
} from "../ai-engine/mock-config";
import { connectMongo, connectRedis, MockApi, redis } from "./db";

type MockApiDocument = {
  _id: unknown;
  name: string;
  slug: string;
  methods: MockMethod[];
  statusCode: number;
  latencyMs: number;
  enabled: boolean;
  sampleResponse: unknown;
  config: MockConfigNode;
  hitCount: number;
  lastHitAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
};

export type MockApiSummary = {
  id: string;
  name: string;
  slug: string;
  url: string;
  methods: MockMethod[];
  statusCode: number;
  latencyMs: number;
  enabled: boolean;
  hitCount: number;
  lastHitAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  preview: unknown;
};

const CACHE_TTL_SECONDS = 300;

export async function listMockApis(origin = "") {
  await connectMongo();

  const docs = await MockApi.find()
    .sort({ updatedAt: -1 })
    .lean<MockApiDocument[]>()
    .exec();

  return docs.map((doc) => toSummary(doc, origin));
}

export async function createMockApi(input: {
  name: string;
  path: string;
  methods: string[];
  rawJson: string;
  statusCode?: number;
  latencyMs?: number;
}) {
  await connectMongo();

  const sampleResponse = parseJsonResponse(input.rawJson);
  const slug = normalizeMockPath(input.path || input.name);
  const methods = normalizeMethods(input.methods);
  const config = compileMockConfig(sampleResponse);
  const statusCode = clampInteger(input.statusCode ?? 200, 100, 599);
  const latencyMs = clampInteger(input.latencyMs ?? 0, 0, 10_000);

  const doc = await MockApi.findOneAndUpdate(
    { slug },
    {
      name: input.name.trim() || slug,
      slug,
      methods,
      statusCode,
      latencyMs,
      enabled: true,
      sampleResponse,
      config,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  )
    .lean<MockApiDocument>()
    .exec();

  if (!doc) {
    throw new Error("Unable to publish mock API.");
  }

  await cacheMockApi(doc);

  return toSummary(doc, "");
}

export async function deleteMockApi(id: string) {
  await connectMongo();
  const doc = await MockApi.findByIdAndDelete(id).lean<MockApiDocument>().exec();
  if (doc) await deleteCache(doc.slug);
  return Boolean(doc);
}

export async function previewMockApi(id: string) {
  await connectMongo();
  const doc = await MockApi.findById(id).lean<MockApiDocument>().exec();
  if (!doc) return null;
  return generateMockData(doc.config);
}

export async function handleMockRequest(request: Request, slug: string) {
  const normalizedSlug = normalizeMockPath(slug);
  const doc = await findMockApi(normalizedSlug);

  if (!doc || !doc.enabled) {
    return Response.json(
      { ok: false, message: "Mock endpoint not found." },
      { status: 404 },
    );
  }

  const method = request.method.toUpperCase();
  if (!doc.methods.includes(method as MockMethod)) {
    return Response.json(
      {
        ok: false,
        message: `${method} is not enabled for /api/mock/${doc.slug}.`,
        allowedMethods: doc.methods,
      },
      {
        status: 405,
        headers: { Allow: doc.methods.join(", ") },
      },
    );
  }

  if (doc.latencyMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, doc.latencyMs));
  }

  const payload = generateMockData(doc.config);
  recordHit(doc.slug).catch(console.error);

  return Response.json(payload, {
    status: doc.statusCode,
    headers: {
      "Cache-Control": "no-store",
      "X-Mock-Api": doc.slug,
      "X-Mock-Generated": "true",
    },
  });
}

async function findMockApi(slug: string) {
  const cached = await getCachedMockApi(slug);
  if (cached) return cached;

  await connectMongo();
  const doc = await MockApi.findOne({ slug }).lean<MockApiDocument>().exec();
  if (doc) await cacheMockApi(doc);
  return doc;
}

async function recordHit(slug: string) {
  await connectMongo();
  await MockApi.updateOne(
    { slug },
    { $inc: { hitCount: 1 }, $set: { lastHitAt: new Date() } },
  ).exec();
  await deleteCache(slug);
}

async function getCachedMockApi(slug: string) {
  try {
    await connectRedis();
    const cached = await redis.get(cacheKey(slug));
    return cached ? (JSON.parse(cached) as MockApiDocument) : null;
  } catch {
    return null;
  }
}

async function cacheMockApi(doc: MockApiDocument) {
  try {
    await connectRedis();
    await redis.setEx(cacheKey(doc.slug), CACHE_TTL_SECONDS, JSON.stringify(doc));
  } catch {
    // Redis is an optimization only; Mongo remains the source of truth.
  }
}

async function deleteCache(slug: string) {
  try {
    await connectRedis();
    await redis.del(cacheKey(slug));
  } catch {
    // Ignore cache misses or unavailable Redis.
  }
}

function cacheKey(slug: string) {
  return `mock-api:${slug}`;
}

function toSummary(doc: MockApiDocument, origin: string): MockApiSummary {
  return {
    id: String(doc._id),
    name: doc.name,
    slug: doc.slug,
    url: `${origin}/api/mock/${doc.slug}`,
    methods: doc.methods,
    statusCode: doc.statusCode,
    latencyMs: doc.latencyMs,
    enabled: doc.enabled,
    hitCount: doc.hitCount,
    lastHitAt: toIsoString(doc.lastHitAt),
    createdAt: toIsoString(doc.createdAt),
    updatedAt: toIsoString(doc.updatedAt),
    preview: generateMockData(doc.config),
  };
}

function toIsoString(value?: Date) {
  if (!value) return null;
  return new Date(value).toISOString();
}

function clampInteger(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(Math.round(value), min), max);
}
