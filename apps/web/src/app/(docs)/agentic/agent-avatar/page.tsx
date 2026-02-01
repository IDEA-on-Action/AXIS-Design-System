'use client'

import { CodeBlock } from '@/components/code-block'
import { PropsTable } from '@/components/props-table'
import Image from 'next/image'
import Link from 'next/link'

// Mock AgentAvatar 컴포넌트
const sizeStyles: Record<string, string> = {
  sm: 'w-6 h-6 text-xs',
  md: 'w-8 h-8 text-sm',
  lg: 'w-10 h-10 text-base',
  xl: 'w-12 h-12 text-lg',
}

const statusStyles: Record<string, string> = {
  online: 'bg-green-500',
  busy: 'bg-yellow-500',
  offline: 'bg-gray-400',
}

const typeColors: Record<string, string> = {
  assistant: 'bg-purple-500',
  tool: 'bg-blue-500',
  system: 'bg-gray-600',
}

const sizePx: Record<string, number> = { sm: 24, md: 32, lg: 40, xl: 48 }

const AgentAvatar = ({ name, src, size = 'md', status, type = 'assistant' }: any) => {
  const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="relative inline-flex">
      {src ? (
        <Image src={src} alt={name} width={sizePx[size]} height={sizePx[size]} className={`rounded-full object-cover ${sizeStyles[size]}`} unoptimized />
      ) : (
        <div className={`rounded-full flex items-center justify-center font-medium text-white ${sizeStyles[size]} ${typeColors[type]}`}>
          {initials}
        </div>
      )}
      {status && (
        <span className={`absolute bottom-0 right-0 rounded-full border-2 border-background ${size === 'sm' ? 'w-2 h-2' : 'w-3 h-3'} ${statusStyles[status]}`} />
      )}
    </div>
  )
}

const agentAvatarProps = [
  { name: 'name', type: 'string', required: true, description: '에이전트 이름' },
  { name: 'src', type: 'string', default: '-', description: '이미지 URL' },
  { name: 'size', type: '"sm" | "md" | "lg" | "xl"', default: '"md"', description: '아바타 크기' },
  { name: 'status', type: '"online" | "busy" | "offline"', default: '-', description: '상태 표시' },
  { name: 'type', type: '"assistant" | "tool" | "system"', default: '"assistant"', description: '에이전트 타입' },
  { name: 'className', type: 'string', default: '-', description: '추가 CSS 클래스' },
]

const basicExample = `import { AgentAvatar } from '@axis-ds/agentic-ui'

export function Example() {
  return (
    <div className="flex items-center gap-4">
      <AgentAvatar name="Claude" type="assistant" status="online" />
      <AgentAvatar name="Code Tool" type="tool" status="busy" />
      <AgentAvatar name="System" type="system" status="offline" />
    </div>
  )
}`

export default function AgentAvatarPage() {
  return (
    <div className="container py-12">
      <div className="max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/agentic" className="hover:text-foreground">Agentic UI</Link>
            <span>/</span>
            <span>AgentAvatar</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">AgentAvatar</h1>
          <p className="text-lg text-muted-foreground">
            AI 에이전트를 나타내는 아바타 컴포넌트입니다. 상태 표시와 에이전트 타입별 색상을 지원합니다.
          </p>
        </div>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Installation</h2>
          <CodeBlock code="npx axis-cli add agent-avatar --agentic" language="bash" />
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Sizes</h2>
          <div className="p-6 rounded-lg border">
            <div className="flex items-end gap-4">
              <div className="text-center">
                <AgentAvatar name="SM" size="sm" type="assistant" />
                <p className="text-xs text-muted-foreground mt-2">sm</p>
              </div>
              <div className="text-center">
                <AgentAvatar name="MD" size="md" type="assistant" />
                <p className="text-xs text-muted-foreground mt-2">md</p>
              </div>
              <div className="text-center">
                <AgentAvatar name="LG" size="lg" type="assistant" />
                <p className="text-xs text-muted-foreground mt-2">lg</p>
              </div>
              <div className="text-center">
                <AgentAvatar name="XL" size="xl" type="assistant" />
                <p className="text-xs text-muted-foreground mt-2">xl</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Types</h2>
          <div className="p-6 rounded-lg border">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <AgentAvatar name="Claude" size="lg" type="assistant" />
                <span className="text-sm">Assistant</span>
              </div>
              <div className="flex items-center gap-2">
                <AgentAvatar name="Code" size="lg" type="tool" />
                <span className="text-sm">Tool</span>
              </div>
              <div className="flex items-center gap-2">
                <AgentAvatar name="SYS" size="lg" type="system" />
                <span className="text-sm">System</span>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Status</h2>
          <div className="p-6 rounded-lg border">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <AgentAvatar name="Online" size="lg" type="assistant" status="online" />
                <span className="text-sm">Online</span>
              </div>
              <div className="flex items-center gap-2">
                <AgentAvatar name="Busy" size="lg" type="assistant" status="busy" />
                <span className="text-sm">Busy</span>
              </div>
              <div className="flex items-center gap-2">
                <AgentAvatar name="Offline" size="lg" type="assistant" status="offline" />
                <span className="text-sm">Offline</span>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Usage</h2>
          <CodeBlock code={basicExample} />
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Props</h2>
          <PropsTable props={agentAvatarProps} />
        </section>
      </div>
    </div>
  )
}
