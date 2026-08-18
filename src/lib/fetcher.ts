import { z } from 'zod';

/**
 * A strictly typed fetch wrapper that guarantees the runtime data 
 * matches the TypeScript interface using Zod.
 */
export async function fetchWithZod<T>(
  url: string,
  schema: z.ZodSchema<T>,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();

  // 🛡️ The Shield: This will throw a ZodError if the API contract is broken,
  // preventing corrupted data from entering the React component tree.
  const parsedData = schema.safeParse(data);

  if (!parsedData.success) {
    console.error("API Contract Violation:", parsedData.error.format());
    throw new Error("Received malformed data from the server.");
  }

  return parsedData.data;
}
