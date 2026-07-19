import { tool } from "@langchain/core/tools";
import { faker } from "@faker-js/faker";
import { z } from "zod";
import { TOOL_DESCRIPTIONS } from "./prompt";

export const amexCardTool = tool(
  () => {
    // Amex cards start with 34 or 37
    const prefix = faker.helpers.arrayElement(["34", "37"]);
    const remaining = faker.string.numeric(13);
    return prefix + remaining;
  },
  {
    name: "amexCard",
    description: TOOL_DESCRIPTIONS.amexCard,
    schema: z.object({}),
  }
);

export const accountTokenTool = tool(
  () => {
    return faker.string.alphanumeric({ length: 15, casing: "upper" });
  },
  {
    name: "accountToken",
    description: TOOL_DESCRIPTIONS.accountToken,
    schema: z.object({}),
  }
);

export const upperFullNameTool = tool(
  () => {
    return faker.person.fullName().toUpperCase();
  },
  {
    name: "upperFullName",
    description: TOOL_DESCRIPTIONS.upperFullName,
    schema: z.object({}),
  }
);

export const customerIdTool = tool(
  () => {
    return faker.string.numeric(12);
  },
  {
    name: "customerId",
    description: TOOL_DESCRIPTIONS.customerId,
    schema: z.object({}),
  }
);

export const customTools = [
  amexCardTool,
  accountTokenTool,
  upperFullNameTool,
  customerIdTool,
];

export type CustomToolName =
  | "amexCard"
  | "accountToken"
  | "upperFullName"
  | "customerId";

export async function invokeCustomTool(name: CustomToolName): Promise<string> {
  const toolMap: Record<CustomToolName, () => string> = {
    amexCard: amexCardTool.invoke.bind(amexCardTool, {}),
    accountToken: accountTokenTool.invoke.bind(accountTokenTool, {}),
    upperFullName: upperFullNameTool.invoke.bind(upperFullNameTool, {}),
    customerId: customerIdTool.invoke.bind(customerIdTool, {}),
  };
  return toolMap[name]();
}
