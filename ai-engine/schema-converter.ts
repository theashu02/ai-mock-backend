import OpenAI from "openai";
import { maskSensitiveData } from "../lib/utils/maskJson";

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENAI_API_KEY || "",
});

export async function generateSchemaFromAI(rawJson: string, format: string) {
  try {
    let parsedJson;
    try {
      parsedJson = JSON.parse(rawJson);
    } catch {
      throw new Error("Invalid JSON provided.");
    }

    const maskedJson = maskSensitiveData(parsedJson);
    
    const systemPrompt = `You are an expert developer and data architect. Convert JSON payloads into a valid ${format} schema/types.

RULES:
1. Analyze the keys and the semantic placeholder values (e.g., "<UUID_STRING>", "<ISO_DATE_STRING>", "<EMAIL_STRING>", "<URI_STRING>") to infer precise types (e.g., Date, string).
2. For numbers, 0 implies integer and 0.0 implies float/decimal.
3. Only output the code, without any markdown formatting wrappers or conversational text. If you must use markdown wrappers, ensure it's just the raw code inside.`;

    const response = await openai.chat.completions.create({
      model: "cohere/north-mini-code:free", 
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: JSON.stringify(maskedJson, null, 2) }
      ],
      temperature: 0,
    });

    let generatedCode = response.choices[0]?.message?.content || "";
    
    // Clean up markdown block if it exists
    if (generatedCode.startsWith("```")) {
      generatedCode = generatedCode.replace(/^```[a-z]*\n/, "").replace(/\n```$/, "");
    }

    return { success: true, data: generatedCode };
  } catch (error: unknown) {
    console.error("Error generating schema:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to generate schema" };
  }
}
