/**
 * Shape extractors shared by every typed section component.
 *
 * The Dashboard's AI Command Center writes `pages.content` as freeform JSON
 * (see app.augenix.ai PRD §7.1). Each typed section here tolerates missing,
 * misspelled, or mistyped fields by running its `content` payload through
 * these helpers and falling back to a `GenericSection` render if a hard
 * requirement is missing.
 *
 * Returning `undefined` instead of a default in `extractString` etc. lets
 * the caller decide between "use a default" and "this section is malformed,
 * fall back to GenericSection."
 */

export function extractString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function extractNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

export function extractObject(value: unknown): Record<string, unknown> | undefined {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return undefined;
}

export function extractArray<T>(
  value: unknown,
  parse: (item: unknown, index: number) => T | undefined,
): T[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const out: T[] = [];
  for (let i = 0; i < value.length; i++) {
    const parsed = parse(value[i], i);
    if (parsed !== undefined) out.push(parsed);
  }
  return out;
}

/**
 * Split a body string on blank lines into an array of paragraph strings.
 * The AI tends to emit \n\n-delimited prose; we render each chunk as its
 * own <p> for readable typography.
 */
export function splitParagraphs(body: string): string[] {
  return body
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length > 0);
}
