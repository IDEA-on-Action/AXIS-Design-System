'use client'

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@axis-ds/ui-react'
import { CodeBlock } from '@/components/code-block'
import { DocPageLayout } from '@/components/doc-page-layout'
import { DocSection } from '@/components/doc-section'
import { KeyboardTable } from '@/components/keyboard-table'
import { PropsTable } from '@/components/props-table'

const commandProps = [
  { name: 'value', type: 'string', default: '-', description: '선택된 값 (controlled)' },
  {
    name: 'onValueChange',
    type: '(value: string) => void',
    default: '-',
    description: '값 변경 콜백',
  },
  {
    name: 'filter',
    type: '(value: string, search: string) => number',
    default: '-',
    description: '커스텀 필터 함수',
  },
  { name: 'shouldFilter', type: 'boolean', default: 'true', description: '자동 필터 활성화 여부' },
  { name: 'loop', type: 'boolean', default: 'false', description: '키보드 순환 탐색 여부' },
]

const basicExample = `import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@axis-ds/ui-react'

export function Example() {
  return (
    <Command className="rounded-lg border shadow-md">
      <CommandInput placeholder="검색..." />
      <CommandList>
        <CommandEmpty>결과가 없습니다.</CommandEmpty>
        <CommandGroup heading="제안">
          <CommandItem>캘린더</CommandItem>
          <CommandItem>검색</CommandItem>
          <CommandItem>이모지</CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="설정">
          <CommandItem>프로필</CommandItem>
          <CommandItem>계정</CommandItem>
          <CommandItem>키보드 단축키</CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  )
}`

export default function CommandPage() {
  return (
    <DocPageLayout
      category="Components"
      categoryHref="/components"
      title="Command"
      description="검색 가능한 커맨드 팔레트 컴포넌트입니다. cmdk 기반."
    >
      <DocSection title="Installation">
        <CodeBlock code="npx axis-cli add command" language="bash" />
      </DocSection>

      <DocSection title="Usage">
        <div className="mb-4 p-6 rounded-lg border">
          <Command className="rounded-lg border shadow-md">
            <CommandInput placeholder="검색..." />
            <CommandList>
              <CommandEmpty>결과가 없습니다.</CommandEmpty>
              <CommandGroup heading="제안">
                <CommandItem>캘린더</CommandItem>
                <CommandItem>검색</CommandItem>
                <CommandItem>이모지</CommandItem>
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading="설정">
                <CommandItem>프로필</CommandItem>
                <CommandItem>계정</CommandItem>
                <CommandItem>키보드 단축키</CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
        <CodeBlock code={basicExample} />
      </DocSection>

      <DocSection title="Components">
        <div className="space-y-4">
          <div className="rounded-lg border p-4">
            <code className="font-mono text-sm font-semibold">Command</code>
            <p className="mt-1 text-sm text-muted-foreground">커맨드 루트 컨테이너</p>
          </div>
          <div className="rounded-lg border p-4">
            <code className="font-mono text-sm font-semibold">CommandInput</code>
            <p className="mt-1 text-sm text-muted-foreground">검색 입력 필드</p>
          </div>
          <div className="rounded-lg border p-4">
            <code className="font-mono text-sm font-semibold">CommandList</code>
            <p className="mt-1 text-sm text-muted-foreground">아이템 목록 컨테이너</p>
          </div>
          <div className="rounded-lg border p-4">
            <code className="font-mono text-sm font-semibold">CommandEmpty</code>
            <p className="mt-1 text-sm text-muted-foreground">검색 결과 없음 표시</p>
          </div>
          <div className="rounded-lg border p-4">
            <code className="font-mono text-sm font-semibold">CommandGroup</code>
            <p className="mt-1 text-sm text-muted-foreground">아이템 그룹 (heading 포함)</p>
          </div>
          <div className="rounded-lg border p-4">
            <code className="font-mono text-sm font-semibold">CommandItem</code>
            <p className="mt-1 text-sm text-muted-foreground">개별 커맨드 아이템</p>
          </div>
          <div className="rounded-lg border p-4">
            <code className="font-mono text-sm font-semibold">CommandSeparator</code>
            <p className="mt-1 text-sm text-muted-foreground">그룹 간 구분선</p>
          </div>
        </div>
      </DocSection>

      <DocSection title="Props">
        <PropsTable props={commandProps} />
      </DocSection>

      <DocSection title="Accessibility">
        <p className="mb-4 text-muted-foreground">
          {'cmdk 기반 명령 팔레트로 combobox/listbox 시맨틱을 제공합니다.'}
        </p>
        <KeyboardTable
          keys={[
            { key: '문자 입력', description: '항목을 필터링합니다.' },
            { key: '↑ ↓', description: '결과 항목 사이를 이동합니다.' },
            { key: 'Enter', description: '포커스된 항목을 선택합니다.' },
          ]}
        />
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li key={0}>{'선택된 항목에 aria-selected가 적용됩니다.'}</li>
        </ul>
      </DocSection>
    </DocPageLayout>
  )
}
