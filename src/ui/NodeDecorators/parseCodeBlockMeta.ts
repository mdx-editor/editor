import { CodeBlockMeta } from '../../types/CodeBlockMeta'

export function parseCodeBlockMeta(meta: string): CodeBlockMeta {
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
