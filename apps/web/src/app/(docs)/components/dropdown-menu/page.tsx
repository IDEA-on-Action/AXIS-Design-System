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
import { PropsTable } from '@/components/props-table'
import Link from 'next/link'

const dropdownMenuProps = [
  { name: 'open', type: 'boolean', default: '-', description: '메뉴 열림 상태 (controlled)' },
  { name: 'onOpenChange', type: '(open: boolean) => void', default: '-', description: '열림 상태 변경 콜백' },
  { name: 'modal', type: 'boolean', default: 'true', description: '모달 모드 여부' },
]

const dropdownMenuContentProps = [
  { name: 'side', type: '"top" | "right" | "bottom" | "left"', default: '"bottom"', description: '메뉴가 나타나는 방향' },
  { name: 'align', type: '"start" | "center" | "end"', default: '"center"', description: '트리거 대비 정렬' },
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
    <div className="container py-12">
      <div className="max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/components" className="hover:text-foreground">Components</Link>
            <span>/</span>
            <span>DropdownMenu</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">DropdownMenu</h1>
          <p className="text-lg text-muted-foreground">
            트리거 버튼에 연결되는 드롭다운 메뉴입니다. Radix UI DropdownMenu 기반.
          </p>
        </div>

        {/* Installation */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Installation</h2>
          <CodeBlock code="npx axis-cli add dropdown-menu" language="bash" />
        </section>

        {/* Usage */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Usage</h2>
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
        </section>

        {/* Components */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Components</h2>
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
        </section>

        {/* Props */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Props</h2>
          <h3 className="text-lg font-medium mb-3">DropdownMenu</h3>
          <PropsTable props={dropdownMenuProps} />
          <h3 className="text-lg font-medium mt-6 mb-3">DropdownMenuContent</h3>
          <PropsTable props={dropdownMenuContentProps} />
        </section>
      </div>
    </div>
  )
}
