'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Button, Badge, Card, CardContent, Tabs, TabsContent, TabsList, TabsTrigger } from '@ax/ui'
import { CodeBlock } from '@/components/code-block'
import { ChevronLeft, Package, Copy, Check, ExternalLink, Calendar, Tag, Layers } from 'lucide-react'
import { cn } from '@/lib/utils'

// 카테고리 정의
const categoryMap: Record<string, { name: string; description: string }> = {
  ui: { name: 'UI', description: '기본 UI 컴포넌트' },
  agentic: { name: 'Agentic', description: 'Agentic UI 컴포넌트' },
  form: { name: 'Form', description: '폼 컴포넌트' },
  layout: { name: 'Layout', description: '레이아웃 컴포넌트' },
  navigation: { name: 'Navigation', description: '네비게이션' },
  feedback: { name: 'Feedback', description: '피드백 컴포넌트' },
  overlay: { name: 'Overlay', description: '오버레이 컴포넌트' },
  'data-display': { name: 'Data Display', description: '데이터 표시' },
  chart: { name: 'Chart', description: '차트/시각화' },
  utility: { name: 'Utility', description: '유틸리티' },
}

// 소스 타입 정의
const sourceTypes = {
  shadcn: { name: 'shadcn/ui', color: 'bg-zinc-500', installPrefix: 'npx shadcn@latest add' },
  axis: { name: 'AXIS', color: 'bg-blue-500', installPrefix: 'npx axis-cli add' },
  monet: { name: 'Monet', color: 'bg-purple-500', installPrefix: 'npx monet add' },
  v0: { name: 'V0', color: 'bg-green-500', installPrefix: 'npx v0 add' },
}

// 샘플 컴포넌트 상세 데이터
const componentDetails: Record<string, {
  id: string
  slug: string
  name: string
  description: string
  category: string
  source: string
  tags: string[]
  updatedAt: string
  code: { path: string; content: string }[]
  dependencies: string[]
  usage: string
}> = {
  'streaming-text': {
    id: 'axis-streaming-text',
    slug: 'streaming-text',
    name: 'Streaming Text',
    description: '에이전트 응답을 실시간으로 스트리밍하여 표시하는 컴포넌트입니다. 타이핑 효과와 커서 애니메이션을 제공합니다.',
    category: 'agentic',
    source: 'axis',
    tags: ['agentic', 'streaming', 'text', 'animation'],
    updatedAt: '2026-01-23',
    code: [
      {
        path: 'streaming-text.tsx',
        content: `'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface StreamingTextProps {
  text: string
  speed?: number
  className?: string
  onComplete?: () => void
}

export function StreamingText({
  text,
  speed = 30,
  className,
  onComplete
}: StreamingTextProps) {
  const [displayedText, setDisplayedText] = useState('')
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    let index = 0
    setDisplayedText('')
    setIsComplete(false)

    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1))
        index++
      } else {
        clearInterval(interval)
        setIsComplete(true)
        onComplete?.()
      }
    }, speed)

    return () => clearInterval(interval)
  }, [text, speed, onComplete])

  return (
    <span className={cn('inline', className)}>
      {displayedText}
      {!isComplete && (
        <span className="inline-block w-2 h-5 bg-primary animate-pulse ml-0.5" />
      )}
    </span>
  )
}`,
      },
    ],
    dependencies: ['react', '@/lib/utils'],
    usage: `import { StreamingText } from '@axis-ds/agentic-ui'

export function Example() {
  return (
    <StreamingText
      text="Hello, I am streaming this text character by character..."
      speed={30}
      onComplete={() => console.log('Complete!')}
    />
  )
}`,
  },
  'button': {
    id: 'shadcn-button',
    slug: 'button',
    name: 'Button',
    description: '다양한 스타일과 크기를 지원하는 버튼 컴포넌트입니다. Radix UI Slot을 사용하여 유연한 컴포지션을 지원합니다.',
    category: 'ui',
    source: 'shadcn',
    tags: ['interactive', 'form', 'ui'],
    updatedAt: '2026-01-20',
    code: [
      {
        path: 'button.tsx',
        content: `import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }`,
      },
    ],
    dependencies: ['@radix-ui/react-slot', 'class-variance-authority', '@/lib/utils'],
    usage: `import { Button } from '@ax/ui'

export function Example() {
  return (
    <div className="flex gap-2">
      <Button>Default</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="destructive">Destructive</Button>
    </div>
  )
}`,
  },
}

// 기본 컴포넌트 템플릿
const defaultComponent = {
  code: [{ path: 'component.tsx', content: '// 코드를 불러오는 중...' }],
  dependencies: [],
  usage: '// 사용 예제를 불러오는 중...',
  updatedAt: '2026-01-23',
}

export default function ComponentDetailPage() {
  const params = useParams()
  const categoryId = params.category as string
  const slug = params.slug as string

  const [copied, setCopied] = useState(false)

  const component = componentDetails[slug] || {
    ...defaultComponent,
    id: `${categoryId}-${slug}`,
    slug,
    name: slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    description: `${slug} 컴포넌트입니다.`,
    category: categoryId,
    source: categoryId === 'agentic' ? 'axis' : 'shadcn',
    tags: [categoryId],
  }

  const categoryInfo = categoryMap[categoryId]
  const sourceInfo = sourceTypes[component.source as keyof typeof sourceTypes]
  const installCommand = `${sourceInfo?.installPrefix || 'npx axis-cli add'} ${slug}`

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="container py-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/library" className="hover:text-foreground flex items-center gap-1">
          <ChevronLeft className="h-4 w-4" />
          Library
        </Link>
        <span>/</span>
        <Link href={`/library/${categoryId}`} className="hover:text-foreground">
          {categoryInfo?.name || categoryId}
        </Link>
        <span>/</span>
        <span className="text-foreground">{component.name}</span>
      </div>

      <div className="max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start gap-4 mb-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Package className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold tracking-tight">{component.name}</h1>
                <Badge variant="secondary">
                  <span className={cn('w-2 h-2 rounded-full mr-1.5', sourceInfo?.color)} />
                  {sourceInfo?.name}
                </Badge>
              </div>
              <p className="text-lg text-muted-foreground">{component.description}</p>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {component.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                <Tag className="h-3 w-3 mr-1" />
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        {/* Installation */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">설치</h2>
          <div className="relative">
            <div className="rounded-lg border bg-muted p-4 font-mono text-sm">
              <code>{installCommand}</code>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2"
              onClick={() => copyToClipboard(installCommand)}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </section>

        {/* Tabs: Preview / Code / Usage */}
        <Tabs defaultValue="code" className="mb-8">
          <TabsList>
            <TabsTrigger value="preview">미리보기</TabsTrigger>
            <TabsTrigger value="code">코드</TabsTrigger>
            <TabsTrigger value="usage">사용 예제</TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="mt-4">
            <Card>
              <CardContent className="p-8 flex items-center justify-center min-h-[200px]">
                <div className="text-center text-muted-foreground">
                  <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>미리보기는 개발 중입니다.</p>
                  <p className="text-sm mt-1">
                    <Link href={`/${categoryId}/${slug}`} className="text-primary hover:underline inline-flex items-center gap-1">
                      기존 문서에서 보기
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="code" className="mt-4">
            {component.code.map((file, index) => (
              <div key={index} className="mb-4">
                <div className="text-sm text-muted-foreground mb-2 font-mono">{file.path}</div>
                <CodeBlock code={file.content} language="tsx" />
              </div>
            ))}
          </TabsContent>

          <TabsContent value="usage" className="mt-4">
            <CodeBlock code={component.usage} language="tsx" />
          </TabsContent>
        </Tabs>

        {/* Dependencies */}
        {component.dependencies && component.dependencies.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">의존성</h2>
            <div className="flex flex-wrap gap-2">
              {component.dependencies.map((dep) => (
                <Badge key={dep} variant="secondary">
                  {dep}
                </Badge>
              ))}
            </div>
          </section>
        )}

        {/* Metadata */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">메타데이터</h2>
          <Card>
            <CardContent className="p-4 grid gap-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground w-24">소스:</span>
                <span>{sourceInfo?.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground w-24">카테고리:</span>
                <span>{categoryInfo?.name || categoryId}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground w-24">업데이트:</span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {component.updatedAt}
                </span>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Related Link */}
        <div className="pt-4 border-t">
          <Link
            href={`/${categoryId === 'agentic' ? 'agentic' : 'components'}/${slug}`}
            className="text-sm text-primary hover:underline inline-flex items-center gap-1"
          >
            상세 문서 보기
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  )
}
