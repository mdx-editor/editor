// Takes string as an input. Separates tokens by space.
// if the token does not have value, just return true as a value.
// Each token can have equal, and it should be parsed to key-value pair.
// the value can have comma, and it should be parsed to array.
// if the value does not have comma, it should be parsed to string.
export function parseCodeBlockMeta(meta: string) {
  const tokens = meta.split(' ')
  const result: Record<string, string | string[] | boolean> = {}
  for (const token of tokens) {
    if (token.includes('=')) {
      const [key, value] = token.split('=')
      if (value.includes(',')) {
        result[key] = value.split(',')
      } else {
        result[key] = value
      }
    } else {
      result[token] = true
    }
  }
  return result
}

export type CodeBlockMeta = ReturnType<typeof parseCodeBlockMeta>
