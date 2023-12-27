/** @internal */
export function makeHslTransparent(hsl: string, alpha: number) {
  return hsl.replace('hsl', 'hsla').replace(')', `, ${alpha})`)
}
