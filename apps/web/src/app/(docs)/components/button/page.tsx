'use client'

import { Button } from '@axis-ds/ui-react'
import { CodeBlock } from '@/components/code-block'
import { PropsTable } from '@/components/props-table'
import { DocPageLayout } from '@/components/doc-page-layout'
import { DocSection } from '@/components/doc-section'
import { KeyboardTable } from '@/components/keyboard-table'
import { Loader2, Mail, ChevronRight } from 'lucide-react'

const buttonProps = [
  {
    name: 'variant',
    type: '"default" | "destructive" | "outline" | "secondary" | "ghost" | "link"',
    default: '"default"',
    description: '버튼 스타일 변형',
  },
  {
    name: 'size',
    type: '"default" | "sm" | "lg" | "icon"',
    default: '"default"',
    description: '버튼 크기',
  },
  {
    name: 'asChild',
    type: 'boolean',
    default: 'false',
    description: 'Slot 컴포넌트로 렌더링 (Radix)',
  },
  { name: 'disabled', type: 'boolean', default: 'false', description: '비활성화 상태' },
  { name: 'className', type: 'string', default: '-', description: '추가 CSS 클래스' },
]

const basicExample = `import { Button } from '@axis-ds/ui-react'

export function Example() {
  return <Button>Click me</Button>
}`

const variantsExample = `<Button variant="default">Default</Button>
<Button variant="destructive">Destructive</Button>
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>`

const sizesExample = `<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon"><Mail /></Button>`

const withIconExample = `<Button>
  <Mail className="mr-2 h-4 w-4" />
  Login with Email
</Button>

<Button>
  Next
  <ChevronRight className="ml-2 h-4 w-4" />
</Button>`

const loadingExample = `<Button disabled>
  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  Please wait
</Button>`

export default function ButtonPage() {
  return (
    <DocPageLayout
      category="Components"
      categoryHref="/components"
      title="Button"
      description="다양한 스타일과 크기를 지원하는 버튼 컴포넌트입니다."
    >
      <DocSection title="Installation">
        <CodeBlock code="npx axis-cli add button" language="bash" />
      </DocSection>

      <DocSection title="Usage">
        <CodeBlock code={basicExample} />
      </DocSection>

      <DocSection title="Variants">
        <div className="mb-4 flex flex-wrap gap-2 p-6 rounded-lg border">
          <Button variant="default">Default</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
        </div>
        <CodeBlock code={variantsExample} />
      </DocSection>

      <DocSection title="Sizes">
        <div className="mb-4 flex flex-wrap items-center gap-2 p-6 rounded-lg border">
          <Button size="sm">Small</Button>
          <Button size="default">Default</Button>
          <Button size="lg">Large</Button>
          <Button size="icon" aria-label="메일">
            <Mail className="h-4 w-4" />
          </Button>
        </div>
        <CodeBlock code={sizesExample} />
      </DocSection>

      <DocSection title="With Icon">
        <div className="mb-4 flex flex-wrap gap-2 p-6 rounded-lg border">
          <Button>
            <Mail className="mr-2 h-4 w-4" />
            Login with Email
          </Button>
          <Button>
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
        <CodeBlock code={withIconExample} />
      </DocSection>

      <DocSection title="Loading State">
        <div className="mb-4 flex flex-wrap gap-2 p-6 rounded-lg border">
          <Button disabled>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Please wait
          </Button>
        </div>
        <CodeBlock code={loadingExample} />
      </DocSection>

      <DocSection title="Props">
        <PropsTable props={buttonProps} />
      </DocSection>

      <DocSection title="Accessibility">
        <p className="mb-4 text-muted-foreground">
          네이티브 <code className="rounded bg-muted px-1 py-0.5 text-sm">&lt;button&gt;</code>{' '}
          요소로 렌더링되어 브라우저 기본 접근성을 그대로 따릅니다.{' '}
          <code className="rounded bg-muted px-1 py-0.5 text-sm">asChild</code>로 다른 요소(예:
          링크)를 렌더링할 때는 해당 요소의 시맨틱을 유지하세요.
        </p>
        <KeyboardTable
          keys={[
            { key: 'Enter', description: '버튼을 활성화합니다.' },
            { key: 'Space', description: '버튼을 활성화합니다.' },
            { key: 'Tab', description: '다음 포커스 가능 요소로 이동합니다.' },
          ]}
        />
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>
            <code className="rounded bg-muted px-1 py-0.5 text-xs">disabled</code> 상태는 포커스와
            클릭에서 제외됩니다.
          </li>
          <li>
            아이콘 전용 버튼(
            <code className="rounded bg-muted px-1 py-0.5 text-xs">{'size="icon"'}</code>)은{' '}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">aria-label</code> 또는{' '}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">sr-only</code> 텍스트로 의미를
            제공하세요.
          </li>
        </ul>
      </DocSection>
    </DocPageLayout>
  )
}
