import { describe, expect, it } from 'vitest'
import YamlParser from 'js-yaml'
import { draftValue, emptyValue, parseFrontmatter, serializeFrontmatter } from '../plugins/frontmatter/frontmatterValues'

describe('structured frontmatter values', () => {
  it('round-trips nested objects, heterogeneous arrays and falsy values', () => {
    const yaml = `title: 'false'\ncover:\n  src: /cover.png\n  alt: ''\ntags: [one, 0, false, null, { nested: [true] }]\nunknown: { keep: yes }`
    expect(YamlParser.load(serializeFrontmatter(parseFrontmatter(yaml)))).toEqual(YamlParser.load(yaml))
  })
  it.each(['null', 'false', '0', "''", '[]', '{}'])('preserves root %s', (yaml) => {
    expect(YamlParser.load(serializeFrontmatter(parseFrontmatter(yaml)))).toEqual(YamlParser.load(yaml))
  })
  it('retains empty and prototype-like keys as own properties', () => {
    const value = draftValue(parseFrontmatter(`'': ''\n__proto__: { polluted: true }\nconstructor: false`)) as Record<string, unknown>
    expect(Object.keys(value)).toEqual(['', '__proto__', 'constructor'])
    expect(Object.getPrototypeOf(value)).toBeNull()
    expect({}).not.toHaveProperty('polluted')
  })
  it('rejects duplicate keys instead of dropping a field', () => {
    const draft = parseFrontmatter('a: 1\nb: 2')
    draft.entries[1].key = 'a'
    expect(() => serializeFrontmatter(draft)).toThrow('Duplicate key')
  })
  it.each(['', '-', 'NaN', 'Infinity', '1oops'])('rejects incomplete number %s', (text) => {
    expect(() => serializeFrontmatter({ ...emptyValue('number'), text })).toThrow('finite number')
  })
  it('reports invalid YAML and cyclic aliases for raw recovery', () => {
    expect(() => parseFrontmatter('cover: [')).toThrow()
    expect(() => parseFrontmatter('a: &a [*a]')).toThrow('Recursive')
  })
  it('handles non-cyclic aliases without sharing mutable drafts', () => {
    const draft = parseFrontmatter('a: &a { x: 1 }\nb: *a')
    draft.entries[0].value.entries[0].value.text = '2'
    expect(draft.entries[1].value.entries[0].value.text).toBe('1')
  })
  it('does not interpret date text as a Date object', () => {
    expect(draftValue(parseFrontmatter('date: 2026-10-16'))).toEqual({ date: '2026-10-16' })
  })
})
