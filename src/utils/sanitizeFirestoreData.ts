type UnknownRecord = Record<string, unknown>;

/**
 * Firestore rejects fields with `undefined` values. This helper removes them deeply.
 */
export function sanitizeFirestoreData<T>(value: T): T {
  if (Array.isArray(value)) {
    return value
      .map((item) => sanitizeFirestoreData(item))
      .filter((item) => item !== undefined) as T;
  }

  if (value && typeof value === 'object') {
    const sanitized: UnknownRecord = {};

    Object.entries(value as UnknownRecord).forEach(([key, fieldValue]) => {
      if (fieldValue === undefined) return;
      const cleanValue = sanitizeFirestoreData(fieldValue);
      if (cleanValue !== undefined) {
        sanitized[key] = cleanValue;
      }
    });

    return sanitized as T;
  }

  return value;
}
