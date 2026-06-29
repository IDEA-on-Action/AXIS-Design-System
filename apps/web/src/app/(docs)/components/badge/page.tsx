'use client'

import { Badge } from '@axis-ds/ui-react'
import { CodeBlock } from '@/components/code-block'
import { DocPageLayout } from '@/components/doc-page-layout'
import { DocSection } from '@/components/doc-section'
import { PropsTable } from '@/components/props-table'

const badgeProps = [
  {
    name: 'variant',
    type: '"default" | "secondary" | "destructive" | "outline"',
    default: '"default"',
    description: '뱃지 스타일 변형',
  },
  { name: 'className', type: 'string', default: '-', description: '추가 CSS 클래스' },
]

const basicExample = `import { Badge } from '@axis-ds/ui-react'

export function Example() {
  return <Badge>Badge</Badge>
}`

const variantsExample = `<Badge>Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Destructive</Badge>
<Badge variant="outline">Outline</Badge>`

export default function BadgePage() {
  return (
    <DocPageLayout
      category="Components"
      categoryHref="/components"
      title="Badge"
      description="상태나 카테고리를 표시하는 뱃지 컴포넌트입니다."
    >
      <DocSection title="Installation">
        <CodeBlock code="npx axis-cli add badge" language="bash" />
      </DocSection>

      <DocSection title="Usage">
        <div className="mb-4 p-6 rounded-lg border">
          <Badge>Badge</Badge>
        </div>
        <CodeBlock code={basicExample} />
      </DocSection>

      <DocSection title="Variants">
        <div className="mb-4 flex flex-wrap gap-2 p-6 rounded-lg border">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>
        <CodeBlock code={variantsExample} />
      </DocSection>

      <DocSection title="Props">
        <PropsTable props={badgeProps} />
      </DocSection>
    </DocPageLayout>
  )
}
