import { type Highlighter, createHighlighter } from 'shiki'

let highlighter: Highlighter | null = null

export async function getHighlighter(): Promise<Highlighter> {
  if (highlighter) return highlighter

  highlighter = await createHighlighter({
    // WI-0022: WCAG 대비 충족 위해 high-contrast 변형 사용 (github-light 빨강 4.38 -> 통과)
    themes: ['github-light-high-contrast', 'github-dark-high-contrast'],
    langs: ['typescript', 'tsx', 'javascript', 'jsx', 'bash', 'json', 'css', 'html'],
  })

  return highlighter
}
