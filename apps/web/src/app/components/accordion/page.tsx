'use client'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@axis-ds/ui-react'
import { CodeBlock } from '@/components/code-block'
import { PropsTable } from '@/components/props-table'
import Link from 'next/link'

const accordionProps = [
  { name: 'type', type: '"single" | "multiple"', default: '"single"', description: '단일/다중 열림 모드' },
  { name: 'value', type: 'string | string[]', default: '-', description: '열린 아이템 값 (controlled)' },
  { name: 'defaultValue', type: 'string | string[]', default: '-', description: '기본 열린 아이템' },
  { name: 'collapsible', type: 'boolean', default: 'false', description: '모든 아이템 닫기 허용 (single 모드)' },
  { name: 'onValueChange', type: '(value: string | string[]) => void', default: '-', description: '값 변경 콜백' },
]

const basicExample = `import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@axis-ds/ui-react'

export function Example() {
  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="item-1">
        <AccordionTrigger>AXIS Design System이란?</AccordionTrigger>
        <AccordionContent>
          React 기반 컴포넌트 라이브러리 및 디자인 토큰 시스템입니다.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>어떻게 설치하나요?</AccordionTrigger>
        <AccordionContent>
          pnpm add @axis-ds/ui-react 명령으로 설치할 수 있습니다.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>커스터마이징이 가능한가요?</AccordionTrigger>
        <AccordionContent>
          Tailwind CSS 기반으로 자유롭게 스타일을 커스터마이징할 수 있습니다.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}`

export default function AccordionPage() {
  return (
    <div className="container py-12">
      <div className="max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/components" className="hover:text-foreground">Components</Link>
            <span>/</span>
            <span>Accordion</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">Accordion</h1>
          <p className="text-lg text-muted-foreground">
            접이식 콘텐츠 패널 컴포넌트입니다. Radix UI Accordion 기반.
          </p>
        </div>

        {/* Installation */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Installation</h2>
          <CodeBlock code="npx axis-cli add accordion" language="bash" />
        </section>

        {/* Usage */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Usage</h2>
          <div className="mb-4 p-6 rounded-lg border">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>AXIS Design System이란?</AccordionTrigger>
                <AccordionContent>
                  React 기반 컴포넌트 라이브러리 및 디자인 토큰 시스템입니다.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>어떻게 설치하나요?</AccordionTrigger>
                <AccordionContent>
                  pnpm add @axis-ds/ui-react 명령으로 설치할 수 있습니다.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>커스터마이징이 가능한가요?</AccordionTrigger>
                <AccordionContent>
                  Tailwind CSS 기반으로 자유롭게 스타일을 커스터마이징할 수 있습니다.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
          <CodeBlock code={basicExample} />
        </section>

        {/* Components */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Components</h2>
          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <code className="font-mono text-sm font-semibold">Accordion</code>
              <p className="mt-1 text-sm text-muted-foreground">아코디언 루트 컨테이너</p>
            </div>
            <div className="rounded-lg border p-4">
              <code className="font-mono text-sm font-semibold">AccordionItem</code>
              <p className="mt-1 text-sm text-muted-foreground">개별 아코디언 아이템</p>
            </div>
            <div className="rounded-lg border p-4">
              <code className="font-mono text-sm font-semibold">AccordionTrigger</code>
              <p className="mt-1 text-sm text-muted-foreground">아이템 열기/닫기 트리거</p>
            </div>
            <div className="rounded-lg border p-4">
              <code className="font-mono text-sm font-semibold">AccordionContent</code>
              <p className="mt-1 text-sm text-muted-foreground">아이템 콘텐츠 영역</p>
            </div>
          </div>
        </section>

        {/* Props */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Props</h2>
          <PropsTable props={accordionProps} />
        </section>
      </div>
    </div>
  )
}
