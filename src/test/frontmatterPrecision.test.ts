import { describe, expect, it } from 'vitest'
import { emptyValue, parseFrontmatter, serializeFrontmatter } from '../plugins/frontmatter/frontmatterValues'

describe('frontmatter integer precision', () => {
  it.each(['9223372036854775807', '-9223372036854775807', '0x20000000000001', '0o400000000000000001'])(
    'falls back to source rather than rounding %s',
    (value) => {
      expect(() => parseFrontmatter(`title: unchanged\nid: ${value}`)).toThrow('safe integer')
    }
  )
  it.each(['9223372036854775807', '-9223372036854775807'])('rejects a numeric draft that would round %s', (text) => {
    expect(() => serializeFrontmatter({ ...emptyValue('number'), text })).toThrow('safe integer')
  })
  it.each(['9007199254740991', '-9007199254740991', '0', '1.25', '1e-10'])('keeps supported number %s', (text) => {
    expect(() => serializeFrontmatter({ ...emptyValue('number'), text })).not.toThrow()
  })
})
