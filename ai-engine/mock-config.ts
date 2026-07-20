import { faker } from "@faker-js/faker";

export type MockMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type MockConfigNode =
  | { type: "object"; fields: Record<string, MockConfigNode> }
  | { type: "array"; item: MockConfigNode; minItems: number; maxItems: number }
  | { type: "scalar"; generator: ScalarGenerator };

type ScalarGenerator =
  | { kind: "uuid" }
  | { kind: "email" }
  | { kind: "url" }
  | { kind: "isoDate" }
  | { kind: "date" }
  | { kind: "fullName" }
  | { kind: "firstName" }
  | { kind: "lastName" }
  | { kind: "phone" }
  | { kind: "city" }
  | { kind: "country" }
  | { kind: "streetAddress" }
  | { kind: "zipCode" }
  | { kind: "company" }
  | { kind: "word" }
  | { kind: "sentence" }
  | { kind: "boolean" }
  | { kind: "integer"; min: number; max: number }
  | { kind: "float"; min: number; max: number }
  | { kind: "null" }
  | { kind: "literal"; value: string | number | boolean | null };

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

const MAX_ARRAY_SAMPLE = 20;

export function compileMockConfig(value: JsonValue, key = "root"): MockConfigNode {
  if (Array.isArray(value)) {
    const sample = value.slice(0, MAX_ARRAY_SAMPLE);
    const item = sample.length
      ? sample.map((entry) => compileMockConfig(entry, key)).reduce(mergeConfig)
      : { type: "scalar", generator: { kind: "literal", value: null } } satisfies MockConfigNode;

    return {
      type: "array",
      item,
      minItems: Math.min(value.length || 1, 1),
      maxItems: Math.max(Math.min(value.length || 3, 8), 1),
    };
  }

  if (isRecord(value)) {
    return {
      type: "object",
      fields: Object.fromEntries(
        Object.entries(value).map(([childKey, childValue]) => [
          childKey,
          compileMockConfig(childValue, childKey),
        ]),
      ),
    };
  }

  return { type: "scalar", generator: inferScalarGenerator(key, value) };
}

export function generateMockData(config: MockConfigNode): JsonValue {
  if (config.type === "object") {
    return Object.fromEntries(
      Object.entries(config.fields).map(([key, value]) => [
        key,
        generateMockData(value),
      ]),
    );
  }

  if (config.type === "array") {
    const length = faker.number.int({
      min: config.minItems,
      max: Math.max(config.minItems, config.maxItems),
    });

    return Array.from({ length }, () => generateMockData(config.item));
  }

  return executeScalar(config.generator);
}

export function parseJsonResponse(rawJson: string): JsonValue {
  try {
    return JSON.parse(rawJson) as JsonValue;
  } catch {
    throw new Error("Response JSON is invalid.");
  }
}

export function normalizeMockPath(path: string) {
  const cleaned = path
    .trim()
    .replace(/^https?:\/\/[^/]+/i, "")
    .replace(/^\/?api\/mock\/?/i, "")
    .replace(/^\/+|\/+$/g, "")
    .replace(/\/{2,}/g, "/");

  if (!cleaned) return "untitled";

  return cleaned
    .split("/")
    .map((segment) =>
      segment
        .replace(/[^a-zA-Z0-9-_]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .toLowerCase(),
    )
    .filter(Boolean)
    .join("/");
}

export function normalizeMethods(methods: string[]): MockMethod[] {
  const allowed = new Set<MockMethod>(["GET", "POST", "PUT", "PATCH", "DELETE"]);
  const normalized = methods
    .map((method) => method.toUpperCase())
    .filter((method): method is MockMethod => allowed.has(method as MockMethod));

  return [...new Set(normalized)].length ? [...new Set(normalized)] : ["GET"];
}

function inferScalarGenerator(key: string, value: JsonValue): ScalarGenerator {
  const normalizedKey = key.toLowerCase();

  if (value === null) return { kind: "null" };
  if (typeof value === "boolean") return { kind: "boolean" };
  if (typeof value === "number") {
    const spread = Math.max(Math.abs(value), 10);
    const min = Math.max(0, value - spread);
    const max = value + spread;

    return Number.isInteger(value)
      ? { kind: "integer", min: Math.floor(min), max: Math.ceil(max) }
      : { kind: "float", min, max };
  }

  if (typeof value !== "string") return { kind: "literal", value: null };

  if (isUuid(value) || /\b(uuid|guid)\b/.test(normalizedKey)) return { kind: "uuid" };
  if (isEmail(value) || normalizedKey.includes("email")) return { kind: "email" };
  if (isUrl(value) || /\b(url|uri|link|avatar|image)\b/.test(normalizedKey)) return { kind: "url" };
  if (isIsoDate(value) || /\b(created|updated|timestamp|datetime)\b/.test(normalizedKey)) {
    return { kind: "isoDate" };
  }
  if (isDate(value) || normalizedKey.endsWith("date")) return { kind: "date" };
  if (/\b(firstname|first_name)\b/.test(normalizedKey)) return { kind: "firstName" };
  if (/\b(lastname|last_name)\b/.test(normalizedKey)) return { kind: "lastName" };
  if (/\b(name|full_name|fullname)\b/.test(normalizedKey)) return { kind: "fullName" };
  if (/\b(phone|mobile|contact)\b/.test(normalizedKey)) return { kind: "phone" };
  if (normalizedKey.includes("city")) return { kind: "city" };
  if (normalizedKey.includes("country")) return { kind: "country" };
  if (/\b(address|street)\b/.test(normalizedKey)) return { kind: "streetAddress" };
  if (/\b(zip|postal|pincode)\b/.test(normalizedKey)) return { kind: "zipCode" };
  if (/\b(company|organization|organisation)\b/.test(normalizedKey)) return { kind: "company" };
  if (value.length > 35) return { kind: "sentence" };

  return { kind: "word" };
}

function executeScalar(generator: ScalarGenerator): JsonValue {
  switch (generator.kind) {
    case "uuid":
      return faker.string.uuid();
    case "email":
      return faker.internet.email();
    case "url":
      return faker.internet.url();
    case "isoDate":
      return faker.date.recent().toISOString();
    case "date":
      return faker.date.recent().toISOString().slice(0, 10);
    case "fullName":
      return faker.person.fullName();
    case "firstName":
      return faker.person.firstName();
    case "lastName":
      return faker.person.lastName();
    case "phone":
      return faker.phone.number();
    case "city":
      return faker.location.city();
    case "country":
      return faker.location.country();
    case "streetAddress":
      return faker.location.streetAddress();
    case "zipCode":
      return faker.location.zipCode();
    case "company":
      return faker.company.name();
    case "word":
      return faker.word.words({ count: { min: 1, max: 3 } });
    case "sentence":
      return faker.lorem.sentence();
    case "boolean":
      return faker.datatype.boolean();
    case "integer":
      return faker.number.int({ min: generator.min, max: generator.max });
    case "float":
      return faker.number.float({
        min: generator.min,
        max: generator.max,
        fractionDigits: 2,
      });
    case "null":
      return null;
    case "literal":
      return generator.value;
  }
}

function mergeConfig(left: MockConfigNode, right: MockConfigNode): MockConfigNode {
  if (left.type === "object" && right.type === "object") {
    const keys = new Set([...Object.keys(left.fields), ...Object.keys(right.fields)]);
    const fields: Record<string, MockConfigNode> = {};

    for (const key of keys) {
      fields[key] =
        left.fields[key] && right.fields[key]
          ? mergeConfig(left.fields[key], right.fields[key])
          : left.fields[key] ?? right.fields[key];
    }

    return { type: "object", fields };
  }

  if (left.type === "array" && right.type === "array") {
    return {
      type: "array",
      item: mergeConfig(left.item, right.item),
      minItems: Math.min(left.minItems, right.minItems),
      maxItems: Math.max(left.maxItems, right.maxItems),
    };
  }

  return left;
}

function isRecord(value: unknown): value is Record<string, JsonValue> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isUrl(value: string) {
  return /^https?:\/\/[^\s]+$/i.test(value);
}

function isIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value);
}

function isDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}
