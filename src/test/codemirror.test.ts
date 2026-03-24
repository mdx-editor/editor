import { describe, expect, it } from 'vitest'
import { normalizeCodeBlockLanguages, EMPTY_VALUE } from '../plugins/codemirror'

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
})
