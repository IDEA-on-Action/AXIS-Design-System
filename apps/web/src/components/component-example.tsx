'use client'

import { Suspense, useState } from 'react'
import { cn } from '@/lib/utils'
import { CodeBlock } from '@/components/code-block'
import { getExample } from '@/registry/example-registry'

interface ComponentExampleProps {
  name: string
  className?: string
}

export function ComponentExample({ name, className }: ComponentExampleProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview')
  const example = getExample(name)

  if (!example) {
    return (
      <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
        예제를 찾을 수 없습니다: {name}
      </div>
    )
  }

  const ExampleComponent = example.component

  return (
    <div className={cn('rounded-lg border', className)}>
      <div className="flex items-center border-b px-4">
        <button
          onClick={() => setActiveTab('preview')}
          className={cn(
            'relative px-3 py-2.5 text-sm font-medium transition-colors',
            activeTab === 'preview'
              ? 'text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Preview
          {activeTab === 'preview' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('code')}
          className={cn(
            'relative px-3 py-2.5 text-sm font-medium transition-colors',
            activeTab === 'code'
              ? 'text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Code
          {activeTab === 'code' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
          )}
        </button>
      </div>
      {activeTab === 'preview' ? (
        <div className="flex min-h-[200px] items-center justify-center p-8">
          <Suspense
            fallback={
              <div className="text-sm text-muted-foreground">로딩 중...</div>
            }
          >
            <ExampleComponent />
          </Suspense>
        </div>
      ) : (
        <CodeBlock code={example.code} language="tsx" />
      )}
    </div>
  )
}
