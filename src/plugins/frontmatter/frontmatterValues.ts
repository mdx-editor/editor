import YamlParser from 'js-yaml'

// Keep the draft separate from YAML values so incomplete numbers and duplicate keys
// remain editable without silently coercing or dropping user input.
export type ValueType = 'string' | 'number' | 'boolean' | 'null' | 'object' | 'array'
export interface ValueDraft {
  type: ValueType
  text: string
  entries: { key: string; value: ValueDraft }[]
}

export function emptyValue(type: ValueType): ValueDraft {
  return { type, text: type === 'boolean' ? 'false' : type === 'number' ? '0' : '', entries: [] }
}

function toDraft(value: unknown, ancestors = new Set<object>(), depth = 0, budget = { remaining: 10000 }): ValueDraft {
  if (--budget.remaining < 0) throw new Error('Frontmatter is too large to edit as fields. Use YAML instead.')
  if (depth > 50) throw new Error('Frontmatter is too deeply nested to edit as fields. Use YAML instead.')
  if (value === null) return emptyValue('null')
  if (typeof value === 'string' || typeof value === 'boolean' || (typeof value === 'number' && Number.isFinite(value))) {
    return { ...emptyValue(typeof value as ValueType), text: String(value) }
  }
  if (typeof value !== 'object' || (!Array.isArray(value) && Object.getPrototypeOf(value) !== Object.prototype)) {
    throw new Error('This YAML value cannot be edited as fields. Use YAML instead.')
  }
  if (ancestors.has(value)) throw new Error('Recursive YAML aliases cannot be edited as fields. Use YAML instead.')
  const next = new Set(ancestors).add(value)
  return {
    ...emptyValue(Array.isArray(value) ? 'array' : 'object'),
    entries: Object.entries(value).map(([key, child]) => ({ key, value: toDraft(child, next, depth + 1, budget) }))
  }
}

export function parseFrontmatter(yaml: string): ValueDraft {
  // CORE_SCHEMA keeps dates as strings and accepts only YAML's basic data types.
  const value: unknown = YamlParser.load(yaml, { schema: YamlParser.CORE_SCHEMA })
  return toDraft(value === undefined ? {} : value)
}

export function draftValue(draft: ValueDraft): unknown {
  switch (draft.type) {
    case 'string':
      return draft.text
    case 'null':
      return null
    case 'boolean':
      return draft.text === 'true'
    case 'number': {
      if (!draft.text.trim() || !Number.isFinite(Number(draft.text))) throw new Error('Enter a finite number.')
      return Number(draft.text)
    }
    case 'array':
      return draft.entries.map(({ value }) => draftValue(value))
    case 'object': {
      const result = Object.create(null) as Record<string, unknown>
      for (const { key, value } of draft.entries) {
        if (Object.hasOwn(result, key)) throw new Error(`Duplicate key: ${key}`)
        result[key] = draftValue(value)
      }
      return result
    }
  }
}

export function serializeFrontmatter(draft: ValueDraft): string {
  return YamlParser.dump(draftValue(draft), { schema: YamlParser.CORE_SCHEMA, noRefs: true }).trimEnd()
}
