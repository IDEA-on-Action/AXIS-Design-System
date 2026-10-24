'use client'

import { useState, useEffect } from 'react'
import { Progress } from '@axis-ds/ui-react'
import { CodeBlock } from '@/components/code-block'
import { DocPageLayout } from '@/components/doc-page-layout'
import { DocSection } from '@/components/doc-section'
import { PropsTable } from '@/components/props-table'

const progressProps = [
  { name: 'value', type: 'number', default: '0', description: '현재 진행률' },
  { name: 'max', type: 'number', default: '100', description: '최대값' },
  {
    name: 'size',
    type: '"sm" | "default" | "lg"',
    default: '"default"',
    description: '프로그레스 바 높이',
  },
  {
    name: 'variant',
    type: '"default" | "success" | "warning" | "destructive"',
    default: '"default"',
    description: '색상 변형',
  },
  {
    name: 'indeterminate',
    type: 'boolean',
    default: 'false',
    description: '불확정 상태 (로딩 애니메이션)',
  },
  { name: 'className', type: 'string', default: '-', description: '추가 CSS 클래스' },
]

const basicExample = `import { Progress } from '@axis-ds/ui-react'

export function Example() {
  return <Progress value={60} />
}`

const variantsExample = `<Progress value={25} variant="default" />
<Progress value={50} variant="success" />
<Progress value={75} variant="warning" />
<Progress value={90} variant="destructive" />`

const indeterminateExample = `<Progress indeterminate aria-label="불러오는 중" />`

const sizesExample = `<Progress value={60} size="sm" />
<Progress value={60} size="default" />
<Progress value={60} size="lg" />`

export default function ProgressPage() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => (prev >= 100 ? 0 : prev + 10))
    }, 500)
    return () => clearInterval(timer)
  }, [])

  return (
    <DocPageLayout
      category="Components"
      categoryHref="/components"
      title="Progress"
      description="작업 진행 상태를 시각적으로 표시하는 프로그레스 바 컴포넌트입니다."
    >
      <DocSection title="Installation">
        <CodeBlock code="npx @axis-ds/cli add progress" language="bash" />
      </DocSection>

      <DocSection title="Usage">
        <CodeBlock code={basicExample} />
      </DocSection>

      <DocSection title="Interactive Demo">
        <div className="mb-4 p-6 rounded-lg border space-y-4">
          <div className="flex items-center gap-4">
            <Progress value={progress} className="flex-1" aria-label="데모 진행률" />
            <span className="text-sm text-muted-foreground w-12">{progress}%</span>
          </div>
        </div>
      </DocSection>

      <DocSection title="Variants">
        <div className="mb-4 p-6 rounded-lg border space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Default (25%)</p>
            <Progress value={25} variant="default" aria-label="Default 25%" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-2">Success (50%)</p>
            <Progress value={50} variant="success" aria-label="Success 50%" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-2">Warning (75%)</p>
            <Progress value={75} variant="warning" aria-label="Warning 75%" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-2">Destructive (90%)</p>
            <Progress value={90} variant="destructive" aria-label="Destructive 90%" />
          </div>
        </div>
        <CodeBlock code={variantsExample} />
      </DocSection>

      <DocSection title="Indeterminate">
        <p className="mb-4 text-sm text-muted-foreground">
          진행률을 알 수 없을 때는 트랙 폭 1/3 의 막대가 왕복합니다. 움직임 줄이기 설정에서는 왼쪽에
          멈춥니다. keyframes 는 @axis-ds/tokens 가 정의합니다(Tailwind 3 preset · Tailwind 4 진입점).
        </p>
        <div className="mb-4 p-6 rounded-lg border space-y-4">
          <Progress indeterminate aria-label="불러오는 중" />
        </div>
        <CodeBlock code={indeterminateExample} />
      </DocSection>

      <DocSection title="Sizes">
        <div className="mb-4 p-6 rounded-lg border space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Small</p>
            <Progress value={60} size="sm" aria-label="Small 60%" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-2">Default</p>
            <Progress value={60} size="default" aria-label="Default 60%" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-2">Large</p>
            <Progress value={60} size="lg" aria-label="Large 60%" />
          </div>
        </div>
        <CodeBlock code={sizesExample} />
      </DocSection>

      <DocSection title="Props">
        <PropsTable props={progressProps} />
      </DocSection>

      <DocSection title="Accessibility">
        <p className="mb-4 text-muted-foreground">{'진행 상태를 나타내는 표시기입니다.'}</p>
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li key={0}>
            {'role="progressbar"와 aria-valuenow / aria-valuemin / aria-valuemax를 제공하세요.'}
          </li>
          <li key={1}>
            {'의미를 보조기술에 전달하도록 접근 가능한 이름(aria-label)을 부여하세요.'}
          </li>
        </ul>
      </DocSection>
    </DocPageLayout>
  )
}
