import { ChatOpenAI } from "@langchain/openai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { HumanMessage } from "@langchain/core/messages";
import { customTools } from "./tools";
import { AGENT_SYSTEM_PROMPT, buildAnalyzePrompt } from "./prompt";

export type FieldConfig =
  | { fn: "amexCard" | "accountToken" | "upperFullName" | "customerId" }
  | { fn: "faker"; method: string };

export interface ConfigMap {
  [key: string]: FieldConfig | ConfigMap;
}

const model = new ChatOpenAI({ model: "gpt-4o", temperature: 0 });

const agent = createReactAgent({
  llm: model,
  tools: customTools,
  prompt: AGENT_SYSTEM_PROMPT,
});

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
