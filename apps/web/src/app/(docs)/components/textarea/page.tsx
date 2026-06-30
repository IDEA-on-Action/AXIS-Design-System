'use client'

import { Label, Textarea } from '@axis-ds/ui-react'
import { CodeBlock } from '@/components/code-block'
import { DocPageLayout } from '@/components/doc-page-layout'
import { DocSection } from '@/components/doc-section'
import { KeyboardTable } from '@/components/keyboard-table'
import { PropsTable } from '@/components/props-table'

const textareaProps = [
  { name: 'placeholder', type: 'string', default: '-', description: '플레이스홀더 텍스트' },
  { name: 'disabled', type: 'boolean', default: 'false', description: '비활성화 여부' },
  { name: 'rows', type: 'number', default: '-', description: '표시할 행 수' },
  { name: 'value', type: 'string', default: '-', description: '입력 값 (controlled)' },
  { name: 'onChange', type: '(e: ChangeEvent) => void', default: '-', description: '값 변경 콜백' },
  { name: 'className', type: 'string', default: '-', description: '추가 CSS 클래스' },
]

const basicExample = `import { Textarea } from '@axis-ds/ui-react'

export function Example() {
  return <Textarea placeholder="내용을 입력하세요." />
}`

const withLabelExample = `import { Label, Textarea } from '@axis-ds/ui-react'

export function Example() {
  return (
    <div className="grid w-full gap-1.5">
      <Label htmlFor="message">메시지</Label>
      <Textarea placeholder="메시지를 입력하세요." id="message" />
      <p className="text-sm text-muted-foreground">
        최대 500자까지 입력할 수 있습니다.
      </p>
    </div>
  )
}`

export default function TextareaPage() {
  return (
    <DocPageLayout
      category="Components"
      categoryHref="/components"
      title="Textarea"
      description="여러 줄 텍스트를 입력할 수 있는 텍스트영역 컴포넌트입니다."
    >
      <DocSection title="Installation">
        <CodeBlock code="npx axis-cli add textarea" language="bash" />
      </DocSection>

      <DocSection title="Usage">
        <div className="mb-4 p-6 rounded-lg border">
          <Textarea placeholder="내용을 입력하세요." />
        </div>
        <CodeBlock code={basicExample} />
      </DocSection>

      <DocSection title="With Label">
        <div className="mb-4 p-6 rounded-lg border">
          <div className="grid w-full gap-1.5">
            <Label htmlFor="message-demo">메시지</Label>
            <Textarea placeholder="메시지를 입력하세요." id="message-demo" />
            <p className="text-sm text-muted-foreground">최대 500자까지 입력할 수 있습니다.</p>
          </div>
        </div>
        <CodeBlock code={withLabelExample} />
      </DocSection>

      <DocSection title="Props">
        <PropsTable props={textareaProps} />
      </DocSection>

      <DocSection title="Accessibility">
        <p className="mb-4 text-muted-foreground">
          {'네이티브 textarea 요소로 브라우저 기본 접근성을 따릅니다.'}
        </p>
        <KeyboardTable
          keys={[
            { key: '표준 텍스트 편집', description: '여러 줄 텍스트 입력과 편집을 지원합니다.' },
          ]}
        />
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li key={0}>{'Label로 연결하거나 aria-label로 접근 가능한 이름을 제공하세요.'}</li>
        </ul>
      </DocSection>
    </DocPageLayout>
  )
}
