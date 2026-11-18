const knownNames = new Set([
  "Error",
  "TypeError",
  "RangeError",
  "SyntaxError",
  "AbortError",
  "TimeoutError",
  "PrismaClientKnownRequestError",
  "PrismaClientUnknownRequestError",
  "PrismaClientValidationError",
  "PrismaClientInitializationError",
  "PrismaClientRustPanicError",
]);

const knownNetworkCodes = new Set([
  "ECONNREFUSED",
  "ECONNRESET",
  "ENOTFOUND",
  "ETIMEDOUT",
  "EAI_AGAIN",
]);

// Error text and stacks can contain whole database queries, input or secret URLs.
export function describeError(error) {
  if (!error) return "unknown error";
  const name = knownNames.has(error.name) ? error.name : "Error";
  const sourceCode = error.code ?? error.errorCode;
  const prismaCode = name.startsWith("PrismaClient") && typeof sourceCode === "string" && /^P[0-9]{4}$/.test(sourceCode);
  return prismaCode || knownNetworkCodes.has(sourceCode) ? `${name} | ${sourceCode}` : name;
}

export function logError(label, error) {
  console.error(`${label}: ${describeError(error)}`);
}
