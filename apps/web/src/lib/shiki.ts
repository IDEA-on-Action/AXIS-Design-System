import { type Highlighter, createHighlighter } from 'shiki'

let highlighter: Highlighter | null = null

export async function getHighlighter(): Promise<Highlighter> {
  if (highlighter) return highlighter

  highlighter = await createHighlighter({
    themes: ['github-light', 'github-dark'],
    langs: ['typescript', 'tsx', 'javascript', 'jsx', 'bash', 'json', 'css', 'html'],
  })

  return highlighter
}
