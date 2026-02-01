'use client'

import { Button } from '@axis-ds/ui-react'
import { Check, Copy } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { getHighlighter } from '@/lib/shiki'

interface CodeBlockProps {
  code: string
  language?: string
  filename?: string
  showLineNumbers?: boolean
  highlightLines?: number[]
}

export function CodeBlock({
  code,
  language = 'tsx',
  filename,
  showLineNumbers = false,
  highlightLines = [],
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
  const [highlightedHtml, setHighlightedHtml] = useState<string>('')

  useEffect(() => {
    let cancelled = false
    getHighlighter()
      .then((hl) => {
        if (cancelled) return
        const supported = hl.getLoadedLanguages()
        const lang = supported.includes(language) ? language : 'text'
        const html = hl.codeToHtml(code, {
          lang,
          themes: {
            light: 'github-light',
            dark: 'github-dark',
          },
          transformers: [
            {
              line(node, line) {
                if (highlightLines.includes(line)) {
                  this.addClassToHast(node, 'highlighted')
                }
                if (showLineNumbers) {
                  node.properties['data-line'] = line
                }
              },
            },
          ],
        })
        setHighlightedHtml(html)
      })
      .catch(() => {
        // fallback: 하이라이팅 실패 시 원본 코드 표시
      })
    return () => {
      cancelled = true
    }
  }, [code, language, showLineNumbers, highlightLines])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative rounded-lg border bg-muted/50 overflow-hidden">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <span className="text-xs text-muted-foreground font-mono">
          {filename || language}
        </span>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopy}>
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>
      </div>
      {highlightedHtml ? (
        <div
          className={cn(
            'overflow-x-auto text-sm [&_pre]:!bg-transparent [&_pre]:p-4 [&_pre]:m-0',
            '[&_.highlighted]:bg-accent/50 [&_.highlighted]:border-l-2 [&_.highlighted]:border-primary',
            showLineNumbers &&
              '[&_span[data-line]]:before:content-[attr(data-line)] [&_span[data-line]]:before:mr-6 [&_span[data-line]]:before:inline-block [&_span[data-line]]:before:w-4 [&_span[data-line]]:before:text-right [&_span[data-line]]:before:text-muted-foreground/40 [&_span[data-line]]:before:text-xs'
          )}
          dangerouslySetInnerHTML={{ __html: highlightedHtml }}
        />
      ) : (
        <pre className="overflow-x-auto p-4">
          <code className="text-sm font-mono">{code}</code>
        </pre>
      )}
    </div>
  )
}
