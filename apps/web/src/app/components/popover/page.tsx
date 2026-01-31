'use client'

import { Button, Input, Label, Popover, PopoverContent, PopoverTrigger } from '@axis-ds/ui-react'
import { CodeBlock } from '@/components/code-block'
import { PropsTable } from '@/components/props-table'
import Link from 'next/link'

const popoverProps = [
  { name: 'open', type: 'boolean', default: '-', description: '팝오버 열림 상태 (controlled)' },
  { name: 'onOpenChange', type: '(open: boolean) => void', default: '-', description: '열림 상태 변경 콜백' },
  { name: 'modal', type: 'boolean', default: 'false', description: '모달 모드 여부' },
]

const popoverContentProps = [
  { name: 'side', type: '"top" | "right" | "bottom" | "left"', default: '"bottom"', description: '팝오버가 나타나는 방향' },
  { name: 'align', type: '"start" | "center" | "end"', default: '"center"', description: '트리거 대비 정렬' },
  { name: 'sideOffset', type: 'number', default: '0', description: '트리거로부터의 거리 (px)' },
]

const basicExample = `import {
  Button,
  Input,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@axis-ds/ui-react'

export function Example() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">설정 열기</Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">크기 설정</h4>
            <p className="text-sm text-muted-foreground">
              요소의 크기를 설정합니다.
            </p>
          </div>
          <div className="grid gap-2">
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="width">너비</Label>
              <Input id="width" defaultValue="100%" className="col-span-2 h-8" />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="height">높이</Label>
              <Input id="height" defaultValue="auto" className="col-span-2 h-8" />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}`

export default function PopoverPage() {
  return (
    <div className="container py-12">
      <div className="max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/components" className="hover:text-foreground">Components</Link>
            <span>/</span>
            <span>Popover</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">Popover</h1>
          <p className="text-lg text-muted-foreground">
            트리거 요소 근처에 표시되는 팝오버 콘텐츠입니다. Radix UI Popover 기반.
          </p>
        </div>

        {/* Installation */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Installation</h2>
          <CodeBlock code="npx axis-cli add popover" language="bash" />
        </section>

        {/* Usage */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Usage</h2>
          <div className="mb-4 p-6 rounded-lg border">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">설정 열기</Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none">크기 설정</h4>
                    <p className="text-sm text-muted-foreground">
                      요소의 크기를 설정합니다.
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <div className="grid grid-cols-3 items-center gap-4">
                      <Label htmlFor="width-demo">너비</Label>
                      <Input id="width-demo" defaultValue="100%" className="col-span-2 h-8" />
                    </div>
                    <div className="grid grid-cols-3 items-center gap-4">
                      <Label htmlFor="height-demo">높이</Label>
                      <Input id="height-demo" defaultValue="auto" className="col-span-2 h-8" />
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <CodeBlock code={basicExample} />
        </section>

        {/* Components */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Components</h2>
          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <code className="font-mono text-sm font-semibold">Popover</code>
              <p className="mt-1 text-sm text-muted-foreground">팝오버 루트 컨테이너</p>
            </div>
            <div className="rounded-lg border p-4">
              <code className="font-mono text-sm font-semibold">PopoverTrigger</code>
              <p className="mt-1 text-sm text-muted-foreground">팝오버를 여는 트리거</p>
            </div>
            <div className="rounded-lg border p-4">
              <code className="font-mono text-sm font-semibold">PopoverContent</code>
              <p className="mt-1 text-sm text-muted-foreground">팝오버 콘텐츠 영역</p>
            </div>
          </div>
        </section>

        {/* Props */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Props</h2>
          <h3 className="text-lg font-medium mb-3">Popover</h3>
          <PropsTable props={popoverProps} />
          <h3 className="text-lg font-medium mt-6 mb-3">PopoverContent</h3>
          <PropsTable props={popoverContentProps} />
        </section>
      </div>
    </div>
  )
}
