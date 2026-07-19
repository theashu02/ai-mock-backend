import { faker } from "@faker-js/faker";
import type { ConfigMap, FieldConfig } from "./agent";
import type { CustomToolName } from "./tools";

const customExecutors: Record<CustomToolName, () => string> = {
  amexCard: () => {
    const prefix = Math.random() < 0.5 ? "34" : "37";
    return prefix + faker.string.numeric(13);
  },
  accountToken: () => faker.string.alphanumeric({ length: 15, casing: "upper" }),
  upperFullName: () => faker.person.fullName().toUpperCase(),
  customerId: () => faker.string.numeric(12),
};

function resolveFaker(method: string): unknown {
  const parts = method.split(".");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let target: any = faker;

  for (const part of parts) {
    if (target == null || typeof target[part] === "undefined") {
      throw new Error(`faker.${method} is not a valid Faker method.`);
    }
    target = target[part];
  }

  if (typeof target !== "function") {
    throw new Error(`faker.${method} resolves to a non-function.`);
  }

  return target();
}

function executeField(config: FieldConfig): unknown {
  if (config.fn === "faker") {
    return resolveFaker(config.method);
  }

  const executor = customExecutors[config.fn as CustomToolName];
  if (!executor) {
    throw new Error(`Unknown tool: "${config.fn}"`);
  }
  return executor();
}

export function generate(configMap: ConfigMap, count?: 1): Record<string, unknown>;
export function generate(configMap: ConfigMap, count: number): Record<string, unknown>[];
export function generate(
  configMap: ConfigMap,
  count = 1
): Record<string, unknown> | Record<string, unknown>[] {
  const generateOne = (map: ConfigMap): Record<string, unknown> => {
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(map)) {
      if (typeof value === "object" && "fn" in value) {
        result[key] = executeField(value as FieldConfig);
      } else {
        result[key] = generateOne(value as ConfigMap);
      }
    }

    return result;
  };

  if (count === 1) return generateOne(configMap);
  return Array.from({ length: count }, () => generateOne(configMap));
}
