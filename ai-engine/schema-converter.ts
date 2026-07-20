type SchemaFormat = "TypeScript" | "Zod" | "Mongoose" | "Prisma" | "GraphQL";
type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

type StringFormat = "uuid" | "email" | "uri" | "date-time" | "date" | "string";
type NumberKind = "int" | "float";
type SchemaKind =
  | "object"
  | "array"
  | "string"
  | "number"
  | "boolean"
  | "null"
  | "unknown"
  | "union";

type SchemaNode = {
  kind: SchemaKind;
  optional?: boolean;
  nullable?: boolean;
  children?: Record<string, SchemaNode>;
  item?: SchemaNode;
  options?: SchemaNode[];
  stringFormat?: StringFormat;
  numberKind?: NumberKind;
};

type SchemaStats = {
  inputBytes: number;
  lineCount: number;
  leafFields: number;
  maxDepth: number;
  totalArrayItems: number;
  sampledArrayItems: number;
  truncatedArrays: number;
  generatedBy: "local-structural-compiler";
};

const MAX_INPUT_BYTES = 5 * 1024 * 1024;
const MAX_ARRAY_SAMPLES = 50;
const MAX_DEPTH = 80;
const SUPPORTED_FORMATS: SchemaFormat[] = [
  "TypeScript",
  "Zod",
  "Mongoose",
  "Prisma",
  "GraphQL",
];

export async function generateSchemaFromAI(rawJson: string, format: string) {
  try {
    if (!SUPPORTED_FORMATS.includes(format as SchemaFormat)) {
      throw new SchemaConversionError(`Unsupported schema format: ${format}`, 400);
    }

    const inputBytes = Buffer.byteLength(rawJson, "utf8");
    if (inputBytes > MAX_INPUT_BYTES) {
      throw new SchemaConversionError(
        `JSON payload is too large. Keep converter requests under ${Math.round(
          MAX_INPUT_BYTES / 1024 / 1024,
        )}MB or process it as an async upload job.`,
        413,
      );
    }

    let parsedJson: JsonValue;
    try {
      parsedJson = JSON.parse(rawJson);
    } catch {
      throw new SchemaConversionError("Invalid JSON provided.", 400);
    }

    const stats: SchemaStats = {
      inputBytes,
      lineCount: rawJson.split(/\r\n|\r|\n/).length,
      leafFields: 0,
      maxDepth: 0,
      totalArrayItems: 0,
      sampledArrayItems: 0,
      truncatedArrays: 0,
      generatedBy: "local-structural-compiler",
    };

    const schema = buildSchemaNode(parsedJson, stats, 0);
    stats.leafFields = countLeafFields(schema);

    return {
      success: true,
      data: renderSchema(schema, format as SchemaFormat),
      meta: stats,
    };
  } catch (error: unknown) {
    console.error("Error generating schema:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to generate schema",
      statusCode: error instanceof SchemaConversionError ? error.statusCode : 500,
    };
  }
}

class SchemaConversionError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
  }
}

function buildSchemaNode(
  value: JsonValue,
  stats: SchemaStats,
  depth: number,
): SchemaNode {
  if (depth > MAX_DEPTH) {
    return { kind: "unknown" };
  }

  stats.maxDepth = Math.max(stats.maxDepth, depth);

  if (value === null) return { kind: "null" };
  if (Array.isArray(value)) return buildArrayNode(value, stats, depth);

  switch (typeof value) {
    case "object":
      return {
        kind: "object",
        children: Object.fromEntries(
          Object.entries(value).map(([key, child]) => [
            key,
            buildSchemaNode(child, stats, depth + 1),
          ]),
        ),
      };
    case "string":
      return { kind: "string", stringFormat: inferStringFormat(value) };
    case "number":
      return {
        kind: "number",
        numberKind: Number.isInteger(value) ? "int" : "float",
      };
    case "boolean":
      return { kind: "boolean" };
    default:
      return { kind: "unknown" };
  }
}

function buildArrayNode(
  values: JsonValue[],
  stats: SchemaStats,
  depth: number,
): SchemaNode {
  stats.totalArrayItems += values.length;

  if (values.length === 0) {
    return { kind: "array", item: { kind: "unknown" } };
  }

  const sampleIndexes = getSampleIndexes(values.length);
  stats.sampledArrayItems += sampleIndexes.length;
  if (sampleIndexes.length < values.length) stats.truncatedArrays += 1;

  const item = sampleIndexes
    .map((index) => buildSchemaNode(values[index], stats, depth + 1))
    .reduce(mergeNodes);

  return { kind: "array", item };
}

function getSampleIndexes(length: number) {
  if (length <= MAX_ARRAY_SAMPLES) {
    return Array.from({ length }, (_, index) => index);
  }

  const indexes = new Set<number>();
  for (let index = 0; index < MAX_ARRAY_SAMPLES; index += 1) {
    indexes.add(Math.floor((index * (length - 1)) / (MAX_ARRAY_SAMPLES - 1)));
  }
  return [...indexes].sort((a, b) => a - b);
}

function mergeNodes(left: SchemaNode, right: SchemaNode): SchemaNode {
  if (left.kind === "null" && right.kind === "null") return { kind: "null" };
  if (left.kind === "null") return markNullable(right);
  if (right.kind === "null") return markNullable(left);

  if (left.kind === "union" || right.kind === "union" || left.kind !== right.kind) {
    return mergeUnionNodes(left, right);
  }

  if (left.kind === "object") {
    return mergeObjectNodes(left, right);
  }

  if (left.kind === "array") {
    return {
      ...left,
      item:
        left.item && right.item
          ? mergeNodes(left.item, right.item)
          : left.item ?? right.item ?? { kind: "unknown" },
      nullable: left.nullable || right.nullable,
      optional: left.optional || right.optional,
    };
  }

  if (left.kind === "string") {
    return {
      ...left,
      stringFormat:
        left.stringFormat === right.stringFormat ? left.stringFormat : "string",
      nullable: left.nullable || right.nullable,
      optional: left.optional || right.optional,
    };
  }

  if (left.kind === "number") {
    return {
      ...left,
      numberKind:
        left.numberKind === "float" || right.numberKind === "float"
          ? "float"
          : "int",
      nullable: left.nullable || right.nullable,
      optional: left.optional || right.optional,
    };
  }

  return {
    ...left,
    nullable: left.nullable || right.nullable,
    optional: left.optional || right.optional,
  };
}

function mergeObjectNodes(left: SchemaNode, right: SchemaNode): SchemaNode {
  const leftChildren = left.children ?? {};
  const rightChildren = right.children ?? {};
  const keys = new Set([...Object.keys(leftChildren), ...Object.keys(rightChildren)]);
  const children: Record<string, SchemaNode> = {};

  for (const key of keys) {
    const leftChild = leftChildren[key];
    const rightChild = rightChildren[key];

    if (leftChild && rightChild) {
      children[key] = mergeNodes(leftChild, rightChild);
    } else {
      children[key] = markOptional(leftChild ?? rightChild ?? { kind: "unknown" });
    }
  }

  return {
    kind: "object",
    children,
    nullable: left.nullable || right.nullable,
    optional: left.optional || right.optional,
  };
}

function mergeUnionNodes(left: SchemaNode, right: SchemaNode): SchemaNode {
  const nodes = flattenUnion(left).concat(flattenUnion(right));
  const options = nodes.reduce<SchemaNode[]>((merged, node) => {
    const matchIndex = merged.findIndex((option) => option.kind === node.kind);
    if (matchIndex === -1) return [...merged, node];

    const next = [...merged];
    next[matchIndex] = mergeNodes(next[matchIndex], node);
    return next;
  }, []);

  if (options.length === 1) return options[0];

  return {
    kind: "union",
    options,
    nullable: left.nullable || right.nullable,
    optional: left.optional || right.optional,
  };
}

function flattenUnion(node: SchemaNode): SchemaNode[] {
  return node.kind === "union" ? node.options ?? [] : [node];
}

function markOptional(node: SchemaNode): SchemaNode {
  return { ...node, optional: true };
}

function markNullable(node: SchemaNode): SchemaNode {
  return { ...node, nullable: true };
}

function inferStringFormat(value: string): StringFormat {
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    return "uuid";
  }
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "email";
  if (/^https?:\/\/[^\s]+$/i.test(value)) return "uri";
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
    return "date-time";
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return "date";
  return "string";
}

function countLeafFields(node: SchemaNode): number {
  if (node.kind === "object") {
    return Object.values(node.children ?? {}).reduce(
      (total, child) => total + countLeafFields(child),
      0,
    );
  }
  if (node.kind === "array") return countLeafFields(node.item ?? { kind: "unknown" });
  if (node.kind === "union") {
    return Math.max(1, ...(node.options ?? []).map(countLeafFields));
  }
  return 1;
}

function renderSchema(schema: SchemaNode, format: SchemaFormat) {
  switch (format) {
    case "Zod":
      return renderZod(schema);
    case "Mongoose":
      return renderMongoose(schema);
    case "Prisma":
      return renderPrisma(schema);
    case "GraphQL":
      return renderGraphQL(schema);
    case "TypeScript":
    default:
      return renderTypeScript(schema);
  }
}

function renderTypeScript(schema: SchemaNode) {
  return `export type Root = ${toTypeScriptType(schema, 0)};\n`;
}

function toTypeScriptType(node: SchemaNode, depth: number): string {
  const base = (() => {
    switch (node.kind) {
      case "object": {
        const entries = Object.entries(node.children ?? {});
        if (entries.length === 0) return "Record<string, never>";

        const indent = "  ".repeat(depth);
        const childIndent = "  ".repeat(depth + 1);
        const lines = entries.map(([key, child]) => {
          const optional = child.optional ? "?" : "";
          return `${childIndent}${formatObjectKey(key)}${optional}: ${toTypeScriptType(
            child,
            depth + 1,
          )};`;
        });
        return `{\n${lines.join("\n")}\n${indent}}`;
      }
      case "array":
        return `Array<${toTypeScriptType(node.item ?? { kind: "unknown" }, depth)}>`;
      case "number":
        return "number";
      case "boolean":
        return "boolean";
      case "null":
        return "null";
      case "union":
        return (node.options ?? [{ kind: "unknown" }])
          .map((option) => toTypeScriptType(option, depth))
          .join(" | ");
      case "string":
        return "string";
      case "unknown":
      default:
        return "unknown";
    }
  })();

  return node.nullable && node.kind !== "null" ? `${base} | null` : base;
}

function renderZod(schema: SchemaNode) {
  return `import { z } from "zod";\n\nexport const RootSchema = ${toZodExpression(
    schema,
    0,
  )};\n\nexport type Root = z.infer<typeof RootSchema>;\n`;
}

function toZodExpression(node: SchemaNode, depth: number): string {
  const base = (() => {
    switch (node.kind) {
      case "object": {
        const entries = Object.entries(node.children ?? {});
        if (entries.length === 0) return "z.object({})";

        const indent = "  ".repeat(depth);
        const childIndent = "  ".repeat(depth + 1);
        const lines = entries.map(([key, child]) => {
          return `${childIndent}${JSON.stringify(key)}: ${toZodExpression(
            child,
            depth + 1,
          )},`;
        });
        return `z.object({\n${lines.join("\n")}\n${indent}})`;
      }
      case "array":
        return `z.array(${toZodExpression(node.item ?? { kind: "unknown" }, depth)})`;
      case "number":
        return node.numberKind === "int" ? "z.number().int()" : "z.number()";
      case "boolean":
        return "z.boolean()";
      case "null":
        return "z.null()";
      case "union":
        return `z.union([${(node.options ?? [{ kind: "unknown" }])
          .map((option) => toZodExpression(option, depth))
          .join(", ")}])`;
      case "string":
        return toZodString(node.stringFormat);
      case "unknown":
      default:
        return "z.unknown()";
    }
  })();

  return wrapOptionalNullable(base, node);
}

function toZodString(format: StringFormat = "string") {
  switch (format) {
    case "uuid":
      return "z.string().uuid()";
    case "email":
      return "z.string().email()";
    case "uri":
      return "z.string().url()";
    case "date-time":
      return "z.string().datetime()";
    case "date":
      return "z.string().date()";
    case "string":
    default:
      return "z.string()";
  }
}

function wrapOptionalNullable(expression: string, node: SchemaNode) {
  let wrapped = expression;
  if (node.nullable && node.kind !== "null") wrapped += ".nullable()";
  if (node.optional) wrapped += ".optional()";
  return wrapped;
}

function renderMongoose(schema: SchemaNode) {
  return `import { Schema, model } from "mongoose";\n\nconst RootSchema = new Schema(${toMongooseExpression(
    schema,
    0,
  )}, { timestamps: true });\n\nexport const RootModel = model("Root", RootSchema);\n`;
}

function toMongooseExpression(node: SchemaNode, depth: number): string {
  switch (node.kind) {
    case "object": {
      const entries = Object.entries(node.children ?? {});
      if (entries.length === 0) return "{}";

      const indent = "  ".repeat(depth);
      const childIndent = "  ".repeat(depth + 1);
      const lines = entries.map(([key, child]) => {
        return `${childIndent}${formatObjectKey(key)}: ${toMongooseField(
          child,
          depth + 1,
        )},`;
      });
      return `{\n${lines.join("\n")}\n${indent}}`;
    }
    default:
      return toMongooseField(node, depth);
  }
}

function toMongooseField(node: SchemaNode, depth: number): string {
  if (node.kind === "array") {
    return fieldWithRequired(
      `[${toMongooseField(node.item ?? { kind: "unknown" }, depth)}]`,
      node,
    );
  }

  if (node.kind === "object") {
    return fieldWithRequired(toMongooseExpression(node, depth), node);
  }

  return fieldWithRequired(toMongooseScalar(node), node);
}

function fieldWithRequired(type: string, node: SchemaNode) {
  if (node.optional || node.nullable) return type;
  return `{ type: ${type}, required: true }`;
}

function toMongooseScalar(node: SchemaNode) {
  if (node.kind === "string") {
    return node.stringFormat === "date" || node.stringFormat === "date-time"
      ? "Date"
      : "String";
  }
  if (node.kind === "number") return "Number";
  if (node.kind === "boolean") return "Boolean";
  return "Schema.Types.Mixed";
}

function renderPrisma(schema: SchemaNode) {
  if (schema.kind !== "object") {
    return `model Root {\n  id String @id @default(cuid())\n  value Json\n}\n`;
  }

  const children = schema.children ?? {};
  const hasId = Boolean(children.id);
  const lines = Object.entries(children).map(([key, child]) =>
    toPrismaField(key, child, key === "id"),
  );

  if (!hasId) {
    lines.unshift("  id String @id @default(cuid())");
  }

  return `model Root {\n${lines.join("\n")}\n}\n`;
}

function toPrismaField(key: string, node: SchemaNode, isId: boolean) {
  const fieldName = toIdentifier(key, "field");
  const mapped = fieldName === key ? "" : ` @map(${JSON.stringify(key)})`;
  const optional = node.optional || node.nullable ? "?" : "";
  const idAttr = isId ? " @id" : "";

  return `  ${fieldName} ${toPrismaType(node)}${optional}${idAttr}${mapped}`;
}

function toPrismaType(node: SchemaNode) {
  if (node.kind === "string") {
    return node.stringFormat === "date" || node.stringFormat === "date-time"
      ? "DateTime"
      : "String";
  }
  if (node.kind === "number") return node.numberKind === "int" ? "Int" : "Float";
  if (node.kind === "boolean") return "Boolean";
  return "Json";
}

function renderGraphQL(schema: SchemaNode) {
  const context = {
    customScalars: new Set<string>(),
    types: new Map<string, string>(),
  };
  const rootType = graphQLBaseType(schema, "Root", context);

  if (rootType !== "Root") {
    context.types.set("Root", `type Root {\n  value: ${rootType}!\n}`);
  }

  const scalars = [...context.customScalars]
    .sort()
    .map((scalar) => `scalar ${scalar}`);

  return [...scalars, ...context.types.values()].join("\n\n") + "\n";
}

function graphQLBaseType(
  node: SchemaNode,
  name: string,
  context: { customScalars: Set<string>; types: Map<string, string> },
): string {
  if (node.kind === "object") {
    const typeName = toTypeName(name);
    if (!context.types.has(typeName)) {
      const fields = Object.entries(node.children ?? {}).map(([key, child]) => {
        return `  ${toIdentifier(key, "field")}: ${graphQLFieldType(
          child,
          `${typeName}_${key}`,
          context,
        )}`;
      });
      context.types.set(typeName, `type ${typeName} {\n${fields.join("\n")}\n}`);
    }
    return typeName;
  }

  if (node.kind === "array") {
    const innerNode = node.item ?? { kind: "unknown" };
    return `[${graphQLBaseType(innerNode, `${name}_Item`, context)}!]`;
  }

  if (node.kind === "string") {
    if (node.stringFormat === "date" || node.stringFormat === "date-time") {
      context.customScalars.add("DateTime");
      return "DateTime";
    }
    return "String";
  }

  if (node.kind === "number") return node.numberKind === "int" ? "Int" : "Float";
  if (node.kind === "boolean") return "Boolean";

  context.customScalars.add("JSON");
  return "JSON";
}

function graphQLFieldType(
  node: SchemaNode,
  name: string,
  context: { customScalars: Set<string>; types: Map<string, string> },
) {
  const base = graphQLBaseType(node, name, context);
  return node.optional || node.nullable ? base : `${base}!`;
}

function formatObjectKey(key: string) {
  return /^[A-Za-z_$][\w$]*$/.test(key) ? key : JSON.stringify(key);
}

function toIdentifier(value: string, fallback: string) {
  const normalized = value.replace(/[^A-Za-z0-9_$]/g, "_");
  if (/^[A-Za-z_$][\w$]*$/.test(normalized)) return normalized;
  return `${fallback}_${normalized}`;
}

function toTypeName(value: string) {
  const normalized = value
    .replace(/[^A-Za-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");

  return /^[A-Za-z][A-Za-z0-9]*$/.test(normalized) ? normalized : "GeneratedType";
}
