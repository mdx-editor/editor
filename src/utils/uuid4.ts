/** @internal */
export function uuidv4() {
  const hex = [...Array(256).keys()].map((index) => index.toString(16).padStart(2, '0'))

  const r = crypto.getRandomValues(new Uint8Array(16))

  r[6] = (r[6] & 0x0f) | 0x40
  r[8] = (r[8] & 0x3f) | 0x80

  return [...r.entries()].map(([index, int]) => ([4, 6, 8, 10].includes(index) ? `-${hex[int]}` : hex[int])).join('')
}
