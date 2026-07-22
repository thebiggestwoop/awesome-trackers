export function isSegmentSettings(value: unknown): value is [string, number][] {
  if (value === undefined) return false;
  if (!Array.isArray(value)) return false;
  for (const entry of value) {
    if (!Array.isArray(entry)) return false;
    if (entry.length !== 2) return false;
    if (typeof entry[0] !== "string") return false;
    if (typeof entry[1] !== "number") return false;
  }
  return true;
}
