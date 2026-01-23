'use client'

import { Button, Badge, Input } from '@axis-ds/ui-react'

interface ComponentPreviewProps {
  name: string
  agentic?: boolean
}

export function ComponentPreview({ name, agentic }: ComponentPreviewProps) {

  // Core UI Previews
  if (!agentic) {
    switch (name) {
      case 'Button':
        return (
          <div className="flex gap-2">
            <Button size="sm">Primary</Button>
            <Button size="sm" variant="outline">Outline</Button>
          </div>
        )
      case 'Card':
        return (
          <div className="text-xs text-muted-foreground p-2 border rounded">
            Card Preview
          </div>
        )
      case 'Input':
        return <Input placeholder="텍스트 입력..." className="h-8 text-sm" />
      case 'Dialog':
        return (
          <Button size="sm" variant="outline">
            Open Dialog
          </Button>
        )
      case 'Badge':
        return (
          <div className="flex gap-2">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
          </div>
        )
      case 'Select':
        return (
          <div className="text-xs border rounded px-2 py-1 text-muted-foreground">
            Select option...
          </div>
        )
      default:
        return <div className="text-xs text-muted-foreground">Preview</div>
    }
  }

  // Agentic UI Previews
  switch (name) {
    case 'StreamingText':
      return (
        <div className="text-sm">
          <span className="animate-pulse">AI가 응답을 생성하고 있습니다...</span>
        </div>
      )
    case 'ApprovalCard':
      return (
        <div className="flex gap-2">
          <Button size="sm" variant="outline">승인</Button>
          <Button size="sm" variant="ghost">거부</Button>
        </div>
      )
    case 'ToolCallCard':
      return (
        <div className="text-xs border rounded p-2 bg-muted/50">
          <span className="font-mono">search_documents()</span>
        </div>
      )
    case 'ThinkingIndicator':
      return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="flex gap-1">
            <span className="animate-bounce delay-0">.</span>
            <span className="animate-bounce delay-100">.</span>
            <span className="animate-bounce delay-200">.</span>
          </div>
          생각 중
        </div>
      )
    case 'SourcePanel':
      return (
        <div className="text-xs border rounded p-2">
          <span className="text-muted-foreground">출처: </span>
          <span className="text-blue-500 underline">문서.pdf</span>
        </div>
      )
    case 'StepTimeline':
      return (
        <div className="flex items-center gap-1 text-xs">
          <div className="w-4 h-4 rounded-full bg-green-500" />
          <div className="w-8 h-0.5 bg-green-500" />
          <div className="w-4 h-4 rounded-full bg-blue-500 animate-pulse" />
          <div className="w-8 h-0.5 bg-muted" />
          <div className="w-4 h-4 rounded-full bg-muted" />
        </div>
      )
    default:
      return <div className="text-xs text-muted-foreground">Preview</div>
  }
}
