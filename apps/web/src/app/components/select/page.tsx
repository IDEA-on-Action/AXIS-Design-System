'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ax/ui'
import { CodeBlock } from '@/components/code-block'
import { PropsTable } from '@/components/props-table'
import Link from 'next/link'

const selectProps = [
  { name: 'value', type: 'string', default: '-', description: '선택된 값 (controlled)' },
  { name: 'onValueChange', type: '(value: string) => void', default: '-', description: '값 변경 콜백' },
  { name: 'defaultValue', type: 'string', default: '-', description: '기본 선택값' },
  { name: 'disabled', type: 'boolean', default: 'false', description: '비활성화 상태' },
]

const basicExample = `import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ax/ui'

export function Example() {
  return (
    <Select>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Theme" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="light">Light</SelectItem>
        <SelectItem value="dark">Dark</SelectItem>
        <SelectItem value="system">System</SelectItem>
      </SelectContent>
    </Select>
  )
}`

export default function SelectPage() {
  return (
    <div className="container py-12">
      <div className="max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/components" className="hover:text-foreground">Components</Link>
            <span>/</span>
            <span>Select</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">Select</h1>
          <p className="text-lg text-muted-foreground">
            드롭다운 선택 컴포넌트입니다. Radix UI Select 기반.
          </p>
        </div>

        {/* Installation */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Installation</h2>
          <CodeBlock code="npx axis-cli add select" language="bash" />
        </section>

        {/* Basic Usage */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Usage</h2>
          <div className="mb-4 p-6 rounded-lg border">
            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <CodeBlock code={basicExample} />
        </section>

        {/* Components */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Components</h2>
          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <code className="font-mono text-sm font-semibold">Select</code>
              <p className="mt-1 text-sm text-muted-foreground">셀렉트 루트 컨테이너</p>
            </div>
            <div className="rounded-lg border p-4">
              <code className="font-mono text-sm font-semibold">SelectTrigger</code>
              <p className="mt-1 text-sm text-muted-foreground">셀렉트를 여는 트리거 버튼</p>
            </div>
            <div className="rounded-lg border p-4">
              <code className="font-mono text-sm font-semibold">SelectValue</code>
              <p className="mt-1 text-sm text-muted-foreground">선택된 값 표시</p>
            </div>
            <div className="rounded-lg border p-4">
              <code className="font-mono text-sm font-semibold">SelectContent</code>
              <p className="mt-1 text-sm text-muted-foreground">드롭다운 콘텐츠 영역</p>
            </div>
            <div className="rounded-lg border p-4">
              <code className="font-mono text-sm font-semibold">SelectItem</code>
              <p className="mt-1 text-sm text-muted-foreground">선택 가능한 아이템</p>
            </div>
          </div>
        </section>

        {/* Props */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Props</h2>
          <PropsTable props={selectProps} />
        </section>
      </div>
    </div>
  )
}
