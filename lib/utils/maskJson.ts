export function maskSensitiveData(input: any): any {
  if (input === null || input === undefined) {
    return input;
  }

  if (Array.isArray(input)) {
    // We truncate the array to a maximum of 3 items to save tokens while keeping schema variations.
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

  // Primitive replacements
  if (typeof input === "string") {
    return "string";
  }

  if (typeof input === "number") {
    return 0;
  }

  if (typeof input === "boolean") {
    return true;
  }

  return typeof input;
}
