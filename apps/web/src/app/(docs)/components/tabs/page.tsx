'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@axis-ds/ui-react'
import { CodeBlock } from '@/components/code-block'
import { DocPageLayout } from '@/components/doc-page-layout'
import { DocSection } from '@/components/doc-section'
import { KeyboardTable } from '@/components/keyboard-table'
import { PropsTable } from '@/components/props-table'

const tabsProps = [
  { name: 'defaultValue', type: 'string', default: '-', description: '기본 선택 탭' },
  { name: 'value', type: 'string', default: '-', description: '선택된 탭 (controlled)' },
  {
    name: 'onValueChange',
    type: '(value: string) => void',
    default: '-',
    description: '탭 변경 콜백',
  },
  {
    name: 'orientation',
    type: '"horizontal" | "vertical"',
    default: '"horizontal"',
    description: '탭 방향',
  },
]

const basicExample = `import { Tabs, TabsContent, TabsList, TabsTrigger } from '@axis-ds/ui-react'

export function Example() {
  return (
    <Tabs defaultValue="account" className="w-[400px]">
      <TabsList>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
      </TabsList>
      <TabsContent value="account">
        Account settings content here.
      </TabsContent>
      <TabsContent value="password">
        Password settings content here.
      </TabsContent>
    </Tabs>
  )
}`

export default function TabsPage() {
  return (
    <DocPageLayout
      category="Components"
      categoryHref="/components"
      title="Tabs"
      description="탭 형식의 콘텐츠 전환 컴포넌트입니다. Radix UI Tabs 기반."
    >
      <DocSection title="Installation">
        <CodeBlock code="npx axis-cli add tabs" language="bash" />
      </DocSection>

      <DocSection title="Usage">
        <div className="mb-4 p-6 rounded-lg border">
          <Tabs defaultValue="account" className="w-[400px]">
            <TabsList>
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="password">Password</TabsTrigger>
            </TabsList>
            <TabsContent value="account" className="p-4">
              <p className="text-sm text-muted-foreground">계정 설정을 변경할 수 있습니다.</p>
            </TabsContent>
            <TabsContent value="password" className="p-4">
              <p className="text-sm text-muted-foreground">비밀번호를 변경할 수 있습니다.</p>
            </TabsContent>
          </Tabs>
        </div>
        <CodeBlock code={basicExample} />
      </DocSection>

      <DocSection title="Components">
        <div className="space-y-4">
          <div className="rounded-lg border p-4">
            <code className="font-mono text-sm font-semibold">Tabs</code>
            <p className="mt-1 text-sm text-muted-foreground">탭 루트 컨테이너</p>
          </div>
          <div className="rounded-lg border p-4">
            <code className="font-mono text-sm font-semibold">TabsList</code>
            <p className="mt-1 text-sm text-muted-foreground">탭 트리거 목록 컨테이너</p>
          </div>
          <div className="rounded-lg border p-4">
            <code className="font-mono text-sm font-semibold">TabsTrigger</code>
            <p className="mt-1 text-sm text-muted-foreground">탭 선택 버튼</p>
          </div>
          <div className="rounded-lg border p-4">
            <code className="font-mono text-sm font-semibold">TabsContent</code>
            <p className="mt-1 text-sm text-muted-foreground">탭 콘텐츠 영역</p>
          </div>
        </div>
      </DocSection>

      <DocSection title="Props">
        <PropsTable props={tabsProps} />
      </DocSection>

      <DocSection title="Accessibility">
        <p className="mb-4 text-muted-foreground">
          {'Radix UI Tabs 기반으로 WAI-ARIA Tabs 패턴을 따릅니다.'}
        </p>
        <KeyboardTable
          keys={[
            { key: '← →', description: '탭 사이를 이동합니다.' },
            { key: 'Home / End', description: '첫/마지막 탭으로 이동합니다.' },
            { key: 'Tab', description: '탭 목록에서 활성 패널로 이동합니다.' },
          ]}
        />
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li key={0}>
            {'role="tablist" / "tab" / "tabpanel"과 aria-selected가 자동 적용됩니다.'}
          </li>
          <li key={1}>{'activationMode로 자동/수동 활성화를 제어할 수 있습니다.'}</li>
        </ul>
      </DocSection>
    </DocPageLayout>
  )
}
