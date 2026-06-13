import { marked } from 'marked'
import DOMPurify from 'dompurify'

export function renderMarkdownSafe(content: string): string {
  const rendered = marked.parse(content, { async: false })
  return DOMPurify.sanitize(typeof rendered === 'string' ? rendered : String(rendered))
}
