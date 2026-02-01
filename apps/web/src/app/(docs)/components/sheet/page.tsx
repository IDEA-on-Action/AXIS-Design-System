'use client'

import { Button, Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@axis-ds/ui-react'
import { CodeBlock } from '@/components/code-block'
import { PropsTable } from '@/components/props-table'
import Link from 'next/link'

const sheetContentProps = [
  { name: 'side', type: '"top" | "right" | "bottom" | "left"', default: '"right"', description: '시트가 나타나는 방향' },
  { name: 'onOpenAutoFocus', type: '(event: Event) => void', default: '-', description: '열릴 때 포커스 이벤트' },
  { name: 'onCloseAutoFocus', type: '(event: Event) => void', default: '-', description: '닫힐 때 포커스 이벤트' },
]

const sheetProps = [
  { name: 'open', type: 'boolean', default: '-', description: '시트 열림 상태 (controlled)' },
  { name: 'onOpenChange', type: '(open: boolean) => void', default: '-', description: '열림 상태 변경 콜백' },
  { name: 'modal', type: 'boolean', default: 'true', description: '모달 모드 여부' },
]

const basicExample = `import {
  Button,
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@axis-ds/ui-react'

export function Example() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Open Sheet</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>설정</SheetTitle>
          <SheetDescription>
            애플리케이션 설정을 변경할 수 있습니다.
          </SheetDescription>
        </SheetHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            설정 내용이 여기에 표시됩니다.
          </p>
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button variant="outline">취소</Button>
          </SheetClose>
          <Button>저장</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}`

export default function SheetPage() {
  return (
    <div className="container py-12">
      <div className="max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/components" className="hover:text-foreground">Components</Link>
            <span>/</span>
            <span>Sheet</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">Sheet</h1>
          <p className="text-lg text-muted-foreground">
            화면 가장자리에서 슬라이드되는 사이드 패널 오버레이입니다. Radix UI Dialog 기반.
          </p>
        </div>

        {/* Installation */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Installation</h2>
          <CodeBlock code="npx axis-cli add sheet" language="bash" />
        </section>

        {/* Usage */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Usage</h2>
          <div className="mb-4 p-6 rounded-lg border">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline">Open Sheet</Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>설정</SheetTitle>
                  <SheetDescription>
                    애플리케이션 설정을 변경할 수 있습니다.
                  </SheetDescription>
                </SheetHeader>
                <div className="py-4">
                  <p className="text-sm text-muted-foreground">
                    설정 내용이 여기에 표시됩니다.
                  </p>
                </div>
                <SheetFooter>
                  <SheetClose asChild>
                    <Button variant="outline">취소</Button>
                  </SheetClose>
                  <Button>저장</Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
          <CodeBlock code={basicExample} />
        </section>

        {/* Components */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Components</h2>
          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <code className="font-mono text-sm font-semibold">Sheet</code>
              <p className="mt-1 text-sm text-muted-foreground">시트 루트 컨테이너</p>
            </div>
            <div className="rounded-lg border p-4">
              <code className="font-mono text-sm font-semibold">SheetTrigger</code>
              <p className="mt-1 text-sm text-muted-foreground">시트를 여는 트리거</p>
            </div>
            <div className="rounded-lg border p-4">
              <code className="font-mono text-sm font-semibold">SheetContent</code>
              <p className="mt-1 text-sm text-muted-foreground">시트 콘텐츠 영역 (side prop으로 방향 설정)</p>
            </div>
            <div className="rounded-lg border p-4">
              <code className="font-mono text-sm font-semibold">SheetHeader</code>
              <p className="mt-1 text-sm text-muted-foreground">시트 헤더</p>
            </div>
            <div className="rounded-lg border p-4">
              <code className="font-mono text-sm font-semibold">SheetTitle</code>
              <p className="mt-1 text-sm text-muted-foreground">시트 제목</p>
            </div>
            <div className="rounded-lg border p-4">
              <code className="font-mono text-sm font-semibold">SheetDescription</code>
              <p className="mt-1 text-sm text-muted-foreground">시트 설명</p>
            </div>
            <div className="rounded-lg border p-4">
              <code className="font-mono text-sm font-semibold">SheetFooter</code>
              <p className="mt-1 text-sm text-muted-foreground">시트 푸터</p>
            </div>
            <div className="rounded-lg border p-4">
              <code className="font-mono text-sm font-semibold">SheetClose</code>
              <p className="mt-1 text-sm text-muted-foreground">시트 닫기 버튼</p>
            </div>
          </div>
        </section>

        {/* Props */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Props</h2>
          <h3 className="text-lg font-medium mb-3">Sheet</h3>
          <PropsTable props={sheetProps} />
          <h3 className="text-lg font-medium mt-6 mb-3">SheetContent</h3>
          <PropsTable props={sheetContentProps} />
        </section>
      </div>
    </div>
  )
}
