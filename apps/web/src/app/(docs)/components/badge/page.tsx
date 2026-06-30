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

      <DocSection title="Accessibility">
        <p className="mb-4 text-muted-foreground">{'상태/분류를 나타내는 장식적 라벨입니다.'}</p>
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li key={0}>
            {'뱃지가 상태를 전달하면 텍스트로도 동일 정보를 제공해 색상 의존을 피하세요.'}
          </li>
          <li key={1}>{'인터랙티브하지 않으므로 클릭 동작이 필요하면 Button을 사용하세요.'}</li>
        </ul>
      </DocSection>
    </DocPageLayout>
  )
}
