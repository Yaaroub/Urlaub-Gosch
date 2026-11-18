/**
 * Privacy-safe error logging for server routes.
 *
 * Full error objects must not be logged: Prisma validation errors, for example,
 * print the complete query including submitted values (guest names, e-mails,
 * messages). We only log the error type, its code and the first line of the
 * message, cut to a fixed length and with e-mail addresses masked.
 */
export function describeError(error) {
  if (!error) return "unknown error";
  const name = typeof error.name === "string" ? error.name : "Error";
  const code = typeof error.code === "string" ? error.code : "";
  const firstLine = String(error.message ?? "")
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean) || "";
  const message = firstLine
    .replace(/[^\s@"'<>]+@[^\s@"'<>]+/g, "<email>")
    .slice(0, 160);
  return [name, code, message].filter(Boolean).join(" | ");
}

export function logError(label, error) {
  console.error(`${label}: ${describeError(error)}`);
}
