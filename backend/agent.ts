import { ChatOpenAI } from "@langchain/openai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { HumanMessage } from "@langchain/core/messages";
import { customTools } from "./tools";
import { AGENT_SYSTEM_PROMPT, buildAnalyzePrompt } from "./prompt";

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * A compiled config map produced by the agent.
 * Each leaf field maps to either a custom tool invocation or a standard Faker call.
 *
 * Example output:
 * {
 *   "cardNumber": { "fn": "amexCard" },
 *   "holderName": { "fn": "upperFullName" },
 *   "email":      { "fn": "faker", "method": "internet.email" }
 * }
 */
export type FieldConfig =
  | { fn: "amexCard" | "accountToken" | "upperFullName" | "customerId" }
  | { fn: "faker"; method: string };

export type ConfigMap = Record<string, FieldConfig | ConfigMap>;

// ─── Agent ────────────────────────────────────────────────────────────────────

const model = new ChatOpenAI({ model: "gpt-4o", temperature: 0 });

const agent = createReactAgent({
  llm: model,
  tools: customTools,
  prompt: AGENT_SYSTEM_PROMPT,
});

/**
 * Analyze a JSON schema template and return a deterministic config map.
 * The config map is produced by gpt-4o once; the generator then executes it
 * without any further LLM calls.
 */
export async function analyzeSchema(schema: unknown): Promise<ConfigMap> {
  const result = await agent.invoke({
    messages: [
      new HumanMessage(buildAnalyzePrompt(schema)),
    ],
  });

  // The last AI message contains the JSON config map
  const messages = result.messages as Array<{ content: string }>;
  const lastMessage = messages[messages.length - 1];
  const raw = lastMessage.content.trim();

  try {
    return JSON.parse(raw) as ConfigMap;
  } catch {
    // If the model wrapped the JSON in markdown fences, strip them
    const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) return JSON.parse(match[1]) as ConfigMap;
    throw new Error(`Agent returned non-JSON output:\n${raw}`);
  }
}
