import { describe, expect, it } from 'vitest'
import { parseCodeBlockMeta } from '../src/nodes/Sandpack/parseCodeBlockMeta'

describe('parsing code block meta string', () => {
  it('parses a simple token to boolean=true', () => {
    expect(parseCodeBlockMeta('token')).toEqual({ token: true })
  })

  it('parses space as separator', () => {
    expect(parseCodeBlockMeta('token1 token2')).toEqual({ token1: true, token2: true })
  })

  it('parses a token with a value to a key-value pair', () => {
    expect(parseCodeBlockMeta('token=value')).toEqual({ token: 'value' })
  })

  it('parses a token with a comma-separated value to an array', () => {
    expect(parseCodeBlockMeta('token=value1,value2')).toEqual({ token: ['value1', 'value2'] })
  })
})
