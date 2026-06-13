import { describe, expect, it } from 'vitest'
import { parseStoredJson, safeReadStoredJson } from '../storage'

describe('storage helpers', () => {
  it('falls back to defaults when stored json is invalid', () => {
    expect(parseStoredJson('{oops}', ['a', 'b'])).toEqual(['a', 'b'])
  })

  it('returns fallback when storage key is missing', () => {
    const storage = { getItem: () => null }
    expect(safeReadStoredJson(storage, 'missing', ['fallback'])).toEqual(['fallback'])
  })
})
