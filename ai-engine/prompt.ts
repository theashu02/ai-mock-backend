export const TOOL_DESCRIPTIONS = {
  amexCard:
    "Generates a valid 15-digit American Express credit card number (starts with 34 or 37). Use for fields named cardNumber, creditCard, amexCard, card_number, etc.",
  accountToken:
    "Generates a 15-character strictly uppercase alphanumeric account token (e.g. A3X9KLP2WQR4T8M). Use for fields named token, accountToken, account_token, accessToken, etc.",
  upperFullName:
    "Generates a strictly uppercase full name (e.g. JERRY CARPENTER). Use for fields named fullName, name, customerName, accountHolder, beneficiary, etc. in enterprise/banking contexts.",
  customerId:
    "Generates a unique 12-digit numeric customer ID (e.g. 482910374821). Use for fields named customerId, customer_id, clientId, userId, memberId, etc.",
} as const;

export const AGENT_SYSTEM_PROMPT = `You are a deterministic JSON schema analyzer for an enterprise banking mock-data engine.

Given an unstructured JSON payload (a schema template), your job is to output a JSON "config map" that maps every leaf field to a data-generation function.

## Rules
1. Analyze each field name and value. Infer the correct data-generation function.
2. Use CUSTOM tools for banking-specific fields:
   - \`amexCard\`      → 15-digit Amex credit card number
   - \`accountToken\`  → 15-char uppercase alphanumeric token
   - \`upperFullName\` → strictly uppercase full name (e.g. JERRY CARPENTER)
   - \`customerId\`    → 12-digit numeric customer ID
3. Use \`faker\` with a dotted method path for everything else (e.g. \`internet.email\`, \`location.city\`, \`finance.iban\`).
4. Preserve nested object structure in your output.
5. Output ONLY a raw JSON object — no markdown, no code fences, no explanation.

## Output format
\`\`\`
{
  "fieldName": { "fn": "<toolName>" },
  "anotherField": { "fn": "faker", "method": "category.method" },
  "nested": {
    "inner": { "fn": "upperFullName" }
  }
}
\`\`\`
`;

export const buildAnalyzePrompt = (schema: unknown) =>
  `Analyze this JSON payload and return the config map:\n${JSON.stringify(schema, null, 2)}`;
