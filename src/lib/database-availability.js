export function isDatabaseUnavailable(error) {
  return ["P1001", "P1002", "P1017"].includes(error?.code);
}

// Retry reads only. Repeating a write could apply the same change twice.
export async function retryDatabaseRead(read) {
  try {
    return await read();
  } catch (error) {
    if (!isDatabaseUnavailable(error)) throw error;
    await new Promise((resolve) => setTimeout(resolve, 500));
    return read();
  }
}
