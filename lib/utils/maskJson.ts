export function maskSensitiveData(input: any): any {
  if (input === null || input === undefined) {
    return input;
  }

  if (Array.isArray(input)) {
    return input.slice(0, 3).map(item => maskSensitiveData(item));
  }

  if (typeof input === "object") {
    const maskedObj: Record<string, any> = {};
    for (const key in input) {
      if (Object.prototype.hasOwnProperty.call(input, key)) {
        maskedObj[key] = maskSensitiveData(input[key]);
      }
    }
    return maskedObj;
  }

  if (typeof input === "string") {
    // Detect formats to help the LLM infer precise types
    if (/^\d{4}-\d{2}-\d{2}T/.test(input)) return "<ISO_DATE_STRING>";
    if (/^[0-9a-f]{8}-[0-9a-f]{4}/i.test(input)) return "<UUID_STRING>";
    if (input.includes("@") && input.includes(".")) return "<EMAIL_STRING>";
    if (/^(https?:\/\/)/.test(input)) return "<URI_STRING>";
    return "<STRING>";
  }

  if (typeof input === "number") {
    return Number.isInteger(input) ? 0 : 0.0;
  }

  if (typeof input === "boolean") {
    return true;
  }

  return typeof input;
}
