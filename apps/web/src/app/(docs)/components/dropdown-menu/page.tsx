'use client'

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@axis-ds/ui-react'
import { CodeBlock } from '@/components/code-block'
import { DocPageLayout } from '@/components/doc-page-layout'
import { DocSection } from '@/components/doc-section'
import { KeyboardTable } from '@/components/keyboard-table'
import { PropsTable } from '@/components/props-table'

const dropdownMenuProps = [
  { name: 'open', type: 'boolean', default: '-', description: '메뉴 열림 상태 (controlled)' },
  {
    name: 'onOpenChange',
    type: '(open: boolean) => void',
    default: '-',
    description: '열림 상태 변경 콜백',
  },
  { name: 'modal', type: 'boolean', default: 'true', description: '모달 모드 여부' },
]

const dropdownMenuContentProps = [
  {
    name: 'side',
    type: '"top" | "right" | "bottom" | "left"',
    default: '"bottom"',
    description: '메뉴가 나타나는 방향',
  },
  {
    name: 'align',
    type: '"start" | "center" | "end"',
    default: '"center"',
    description: '트리거 대비 정렬',
  },
  { name: 'sideOffset', type: 'number', default: '0', description: '트리거로부터의 거리 (px)' },
]

const basicExample = `import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@axis-ds/ui-react'

export function Example() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">메뉴 열기</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>내 계정</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            프로필
            <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            설정
            <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          로그아웃
          <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}`

export default function DropdownMenuPage() {
  return (
    <DocPageLayout
      category="Components"
      categoryHref="/components"
      title="DropdownMenu"
      description="트리거 버튼에 연결되는 드롭다운 메뉴입니다. Radix UI DropdownMenu 기반."
    >
      <DocSection title="Installation">
        <CodeBlock code="npx axis-cli add dropdown-menu" language="bash" />
      </DocSection>

      <DocSection title="Usage">
        <div className="mb-4 p-6 rounded-lg border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">메뉴 열기</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>내 계정</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  프로필
                  <DropdownMenuShortcut>&#8679;&#8984;P</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  설정
                  <DropdownMenuShortcut>&#8984;S</DropdownMenuShortcut>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                로그아웃
                <DropdownMenuShortcut>&#8679;&#8984;Q</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <CodeBlock code={basicExample} />
      </DocSection>

      <DocSection title="Components">
        <div className="space-y-4">
          <div className="rounded-lg border p-4">
            <code className="font-mono text-sm font-semibold">DropdownMenu</code>
            <p className="mt-1 text-sm text-muted-foreground">드롭다운 메뉴 루트 컨테이너</p>
          </div>
          <div className="rounded-lg border p-4">
            <code className="font-mono text-sm font-semibold">DropdownMenuTrigger</code>
            <p className="mt-1 text-sm text-muted-foreground">메뉴를 여는 트리거</p>
          </div>
          <div className="rounded-lg border p-4">
            <code className="font-mono text-sm font-semibold">DropdownMenuContent</code>
            <p className="mt-1 text-sm text-muted-foreground">메뉴 콘텐츠 영역</p>
          </div>
          <div className="rounded-lg border p-4">
            <code className="font-mono text-sm font-semibold">DropdownMenuItem</code>
            <p className="mt-1 text-sm text-muted-foreground">메뉴 아이템</p>
          </div>
          <div className="rounded-lg border p-4">
            <code className="font-mono text-sm font-semibold">DropdownMenuLabel</code>
            <p className="mt-1 text-sm text-muted-foreground">메뉴 그룹 레이블</p>
          </div>
          <div className="rounded-lg border p-4">
            <code className="font-mono text-sm font-semibold">DropdownMenuSeparator</code>
            <p className="mt-1 text-sm text-muted-foreground">메뉴 아이템 구분선</p>
          </div>
          <div className="rounded-lg border p-4">
            <code className="font-mono text-sm font-semibold">DropdownMenuGroup</code>
            <p className="mt-1 text-sm text-muted-foreground">메뉴 아이템 그룹</p>
          </div>
          <div className="rounded-lg border p-4">
            <code className="font-mono text-sm font-semibold">DropdownMenuShortcut</code>
            <p className="mt-1 text-sm text-muted-foreground">키보드 단축키 표시</p>
          </div>
        </div>
      </DocSection>

      <DocSection title="Props">
        <h3 className="text-lg font-medium mb-3">DropdownMenu</h3>
        <PropsTable props={dropdownMenuProps} />
        <h3 className="text-lg font-medium mt-6 mb-3">DropdownMenuContent</h3>
        <PropsTable props={dropdownMenuContentProps} />
      </DocSection>

      <DocSection title="Accessibility">
        <p className="mb-4 text-muted-foreground">
          {'Radix UI DropdownMenu 기반으로 WAI-ARIA Menu 패턴을 따릅니다.'}
        </p>
        <KeyboardTable
          keys={[
            { key: 'Enter / Space', description: '메뉴를 열거나 포커스된 항목을 실행합니다.' },
            { key: '↑ ↓', description: '메뉴 항목 사이를 이동합니다.' },
            { key: '→ ←', description: '하위 메뉴를 열거나 닫습니다.' },
            { key: 'Esc', description: '메뉴를 닫고 트리거로 포커스를 복원합니다.' },
          ]}
        />
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li key={0}>
            {'role="menu" / "menuitem"이 자동 적용되고 포커스가 메뉴 안에서 관리됩니다.'}
          </li>
          <li key={1}>{'글자 입력 시 해당 항목으로 type-ahead 이동합니다.'}</li>
        </ul>
      </DocSection>
    </DocPageLayout>
  )
}
