import { describe, expect, it } from 'vitest'
import { renderMarkdownSafe } from '../markdown'

describe('renderMarkdownSafe', () => {
  it('removes script injection from rendered markdown', () => {
    const html = renderMarkdownSafe('# hi\n<script>alert(1)</script>')
    expect(html).not.toContain('<script>')
    expect(html).toContain('<h1>hi</h1>')
  })
})
