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
    } catch (e) {
      throw new Error("Invalid JSON provided.");
    }

    const maskedJson = maskSensitiveData(parsedJson);
    
    const prompt = `You are an expert developer. Convert the following JSON response into a valid ${format} schema/types.
    
The JSON provided below has been masked for privacy (e.g. strings replaced with "string", numbers with 0). 
Only output the code, without any markdown formatting wrappers or conversational text. If you must use markdown wrappers, ensure it's just the raw code inside.

Input JSON:
${JSON.stringify(maskedJson, null, 2)}
`;

    const response = await openai.chat.completions.create({
      model: "cohere/north-mini-code:free", 
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
    });

    let generatedCode = response.choices[0]?.message?.content || "";
    
    // Clean up markdown block if it exists
    if (generatedCode.startsWith("```")) {
      generatedCode = generatedCode.replace(/^```[a-z]*\n/, "").replace(/\n```$/, "");
    }

    return { success: true, data: generatedCode };
  } catch (error: any) {
    console.error("Error generating schema:", error);
    return { success: false, error: error.message || "Failed to generate schema" };
  }
}
