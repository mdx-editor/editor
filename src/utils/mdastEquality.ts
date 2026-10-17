// Directive attributes are plain objects, so a `position` attribute must still count.
function serializeWithoutPositions(value: unknown) {
  return JSON.stringify(value, (key, nested: unknown) => (key === 'position' && typeof nested === 'object' ? undefined : nested))
}

/**
 * Imported mdast carries source positions that nested editor exports never have.
 * @internal
 */
export function isMdastEqualIgnoringPositions(a: unknown, b: unknown): boolean {
  return serializeWithoutPositions(a) === serializeWithoutPositions(b)
}
