'use client'

import {
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
import { CodeBlock } from '@/components/code-block'
import { DocPageLayout } from '@/components/doc-page-layout'
import { DocSection } from '@/components/doc-section'
import { KeyboardTable } from '@/components/keyboard-table'
import { PropsTable } from '@/components/props-table'

const sheetContentProps = [
  {
    name: 'side',
    type: '"top" | "right" | "bottom" | "left"',
    default: '"right"',
    description: '시트가 나타나는 방향',
  },
  {
    name: 'onOpenAutoFocus',
    type: '(event: Event) => void',
    default: '-',
    description: '열릴 때 포커스 이벤트',
  },
  {
    name: 'onCloseAutoFocus',
    type: '(event: Event) => void',
    default: '-',
    description: '닫힐 때 포커스 이벤트',
  },
]

const sheetProps = [
  { name: 'open', type: 'boolean', default: '-', description: '시트 열림 상태 (controlled)' },
  {
    name: 'onOpenChange',
    type: '(open: boolean) => void',
    default: '-',
    description: '열림 상태 변경 콜백',
  },
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
    <DocPageLayout
      category="Components"
      categoryHref="/components"
      title="Sheet"
      description="화면 가장자리에서 슬라이드되는 사이드 패널 오버레이입니다. Radix UI Dialog 기반."
    >
      <DocSection title="Installation">
        <CodeBlock code="npx axis-cli add sheet" language="bash" />
      </DocSection>

      <DocSection title="Usage">
        <div className="mb-4 p-6 rounded-lg border">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">Open Sheet</Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>설정</SheetTitle>
                <SheetDescription>애플리케이션 설정을 변경할 수 있습니다.</SheetDescription>
              </SheetHeader>
              <div className="py-4">
                <p className="text-sm text-muted-foreground">설정 내용이 여기에 표시됩니다.</p>
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
      </DocSection>

      <DocSection title="Components">
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
            <p className="mt-1 text-sm text-muted-foreground">
              시트 콘텐츠 영역 (side prop으로 방향 설정)
            </p>
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
      </DocSection>

      <DocSection title="Props">
        <h3 className="text-lg font-medium mb-3">Sheet</h3>
        <PropsTable props={sheetProps} />
        <h3 className="text-lg font-medium mt-6 mb-3">SheetContent</h3>
        <PropsTable props={sheetContentProps} />
      </DocSection>

      <DocSection title="Accessibility">
        <p className="mb-4 text-muted-foreground">
          {'Radix UI Dialog 기반의 측면 패널로 Dialog (Modal) 패턴을 따릅니다.'}
        </p>
        <KeyboardTable
          keys={[
            { key: 'Esc', description: '시트를 닫습니다.' },
            { key: 'Tab', description: '시트 내부에서 포커스를 순환합니다 (focus trap).' },
          ]}
        />
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li key={0}>
            {'role="dialog" + aria-modal="true"가 적용되고 열릴 때 포커스가 내부로 이동합니다.'}
          </li>
          <li key={1}>{'제목(Title)을 제공해 aria-labelledby로 연결하세요.'}</li>
        </ul>
      </DocSection>
    </DocPageLayout>
  )
}
