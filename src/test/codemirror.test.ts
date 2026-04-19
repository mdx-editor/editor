import { describe, expect, it } from 'vitest'
import {
  getCodeBlockLanguageSelectData,
  normalizeCodeBlockLanguages,
  EMPTY_VALUE,
  type CodeBlockLanguageSupport
} from '../plugins/codemirror'

describe('normalizeCodeBlockLanguages', () => {
  describe('record format', () => {
    it('produces items and identity keyMap for simple input', () => {
      const result = normalizeCodeBlockLanguages({ js: 'JavaScript', css: 'CSS' })
      expect(result.items).toEqual([
        { value: 'js', label: 'JavaScript' },
        { value: 'css', label: 'CSS' }
      ])
      expect(result.keyMap).toEqual({ js: 'js', css: 'css' })
    })

    it('deduplicates entries with the same label', () => {
      const result = normalizeCodeBlockLanguages({
        js: 'JavaScript',
        javascript: 'JavaScript',
        css: 'CSS'
      })
      expect(result.items).toEqual([
        { value: 'js', label: 'JavaScript' },
        { value: 'css', label: 'CSS' }
      ])
      expect(result.keyMap.js).toBe('js')
      expect(result.keyMap.javascript).toBe('js')
    })

    it('handles empty string key using EMPTY_VALUE sentinel', () => {
      const result = normalizeCodeBlockLanguages({ '': 'Unspecified', js: 'JavaScript' })
      expect(result.items).toEqual([
        { value: EMPTY_VALUE, label: 'Unspecified' },
        { value: 'js', label: 'JavaScript' }
      ])
      expect(result.keyMap['']).toBe(EMPTY_VALUE)
    })
  })

  describe('array format', () => {
    it('uses first alias as canonical key', () => {
      const result = normalizeCodeBlockLanguages([
        { name: 'JavaScript', alias: ['js', 'javascript'] },
        { name: 'CSS', alias: ['css'] }
      ])
      expect(result.items).toEqual([
        { value: 'js', label: 'JavaScript' },
        { value: 'css', label: 'CSS' }
      ])
      expect(result.keyMap.js).toBe('js')
      expect(result.keyMap.javascript).toBe('js')
      expect(result.keyMap.css).toBe('css')
    })

    it('falls back to lowercased name when no aliases', () => {
      const result = normalizeCodeBlockLanguages([{ name: 'Python' }])
      expect(result.items).toEqual([{ value: 'python', label: 'Python' }])
      expect(result.keyMap.python).toBe('python')
    })

    it('maps extensions into keyMap', () => {
      const result = normalizeCodeBlockLanguages([{ name: 'TypeScript', alias: ['ts', 'typescript'], extensions: ['ts', 'mts'] }])
      expect(result.keyMap.ts).toBe('ts')
      expect(result.keyMap.typescript).toBe('ts')
      expect(result.keyMap.mts).toBe('ts')
    })

    it('maps lowercased name into keyMap', () => {
      const result = normalizeCodeBlockLanguages([{ name: 'JavaScript', alias: ['js'] }])
      expect(result.keyMap.javascript).toBe('js')
    })

    it('maps empty-string canonical to EMPTY_VALUE sentinel', () => {
      const result = normalizeCodeBlockLanguages([
        { name: 'Plain text', alias: [''] },
        { name: 'JavaScript', alias: ['js'] }
      ])
      expect(result.items).toEqual([
        { value: EMPTY_VALUE, label: 'Plain text' },
        { value: 'js', label: 'JavaScript' }
      ])
      expect(result.keyMap['']).toBe(EMPTY_VALUE)
    })
  })

  describe('supportMap', () => {
    it('stores support keyed by canonical key', () => {
      const mockSupport: CodeBlockLanguageSupport = { extension: [] }
      const result = normalizeCodeBlockLanguages([{ name: 'JavaScript', alias: ['js', 'javascript'], support: mockSupport }])
      expect(result.supportMap.js).toBe(mockSupport)
    })

    it('does not add entry when support is not provided', () => {
      const result = normalizeCodeBlockLanguages([{ name: 'JavaScript', alias: ['js'] }])
      expect(result.supportMap).toEqual({})
    })

    it('stores support using lowercased name when no aliases', () => {
      const mockSupport: CodeBlockLanguageSupport = { extension: [] }
      const result = normalizeCodeBlockLanguages([{ name: 'Python', support: mockSupport }])
      expect(result.supportMap.python).toBe(mockSupport)
    })

    it('is empty for record format', () => {
      const result = normalizeCodeBlockLanguages({ js: 'JavaScript' })
      expect(result.supportMap).toEqual({})
    })
  })

  describe('empty input', () => {
    it('handles empty record', () => {
      const result = normalizeCodeBlockLanguages({})
      expect(result.items).toEqual([])
      expect(result.keyMap).toEqual({})
    })

    it('handles empty array', () => {
      const result = normalizeCodeBlockLanguages([])
      expect(result.items).toEqual([])
      expect(result.keyMap).toEqual({})
    })
  })

  describe('unknown language', () => {
    it('returns undefined from keyMap for an unknown language (record format)', () => {
      const result = normalizeCodeBlockLanguages({ js: 'JavaScript' })
      expect(result.keyMap.brainfuck).toBeUndefined()
      expect(Object.hasOwn(result.keyMap, 'brainfuck')).toBe(false)
    })

    it('returns undefined from keyMap for an unknown language (array format)', () => {
      const result = normalizeCodeBlockLanguages([{ name: 'JavaScript', alias: ['js'], extensions: ['js', 'mjs'] }])
      expect(result.keyMap.brainfuck).toBeUndefined()
      expect(Object.hasOwn(result.keyMap, 'brainfuck')).toBe(false)
    })

    it('returns undefined from supportMap for an unknown language', () => {
      const mockSupport: CodeBlockLanguageSupport = { extension: [] }
      const result = normalizeCodeBlockLanguages([{ name: 'JavaScript', alias: ['js'], support: mockSupport }])
      expect(result.supportMap.brainfuck).toBeUndefined()
    })

    it('does not include an unknown language in items', () => {
      const result = normalizeCodeBlockLanguages([{ name: 'JavaScript', alias: ['js'] }])
      expect(result.items.find((item) => item.value === 'brainfuck')).toBeUndefined()
    })
  })
})

describe('getCodeBlockLanguageSelectData', () => {
  it('returns configured items for a known language', () => {
    const normalized = normalizeCodeBlockLanguages([{ name: 'JavaScript', alias: ['js'] }])
    expect(getCodeBlockLanguageSelectData(normalized, 'js')).toEqual({
      value: 'js',
      items: [{ value: 'js', label: 'JavaScript' }]
    })
  })

  it('adds a temporary item for an unknown language', () => {
    const normalized = normalizeCodeBlockLanguages([{ name: 'JavaScript', alias: ['js'] }])
    expect(getCodeBlockLanguageSelectData(normalized, 'brainfuck')).toEqual({
      value: 'brainfuck',
      items: [
        { value: 'js', label: 'JavaScript' },
        { value: 'brainfuck', label: 'brainfuck' }
      ]
    })
  })

  it('keeps the empty-language sentinel intact', () => {
    const normalized = normalizeCodeBlockLanguages([{ name: 'Plain text', alias: [''] }])
    expect(getCodeBlockLanguageSelectData(normalized, '')).toEqual({
      value: EMPTY_VALUE,
      items: [{ value: EMPTY_VALUE, label: 'Plain text' }]
    })
  })
})
