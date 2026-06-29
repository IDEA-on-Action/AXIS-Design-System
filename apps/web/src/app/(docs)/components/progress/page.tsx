'use client'

import { useState, useEffect } from 'react'
import { Button } from '@axis-ds/ui-react'
import { CodeBlock } from '@/components/code-block'
import { DocPageLayout } from '@/components/doc-page-layout'
import { DocSection } from '@/components/doc-section'
import { PropsTable } from '@/components/props-table'

// Mock Progress 컴포넌트
const sizeClasses: Record<string, string> = {
  sm: 'h-1',
  default: 'h-2',
  lg: 'h-3',
}

const variantColors: Record<string, string> = {
  default: 'bg-primary',
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  destructive: 'bg-red-500',
}

const Progress = ({
  value = 0,
  max = 100,
  size = 'default',
  variant = 'default',
  indeterminate = false,
}: any) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  return (
    <div
      className={`relative w-full overflow-hidden rounded-full bg-muted ${sizeClasses[size]}`}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemax={max}
    >
      <div
        className={`h-full flex-1 transition-all duration-300 ease-in-out ${variantColors[variant]} ${indeterminate ? 'animate-progress-indeterminate' : ''}`}
        style={
          indeterminate ? { width: '50%' } : { transform: `translateX(-${100 - percentage}%)` }
        }
      />
    </div>
  )
}

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
        <CodeBlock code="npx axis-cli add progress" language="bash" />
      </DocSection>

      <DocSection title="Usage">
        <CodeBlock code={basicExample} />
      </DocSection>

      <DocSection title="Interactive Demo">
        <div className="mb-4 p-6 rounded-lg border space-y-4">
          <div className="flex items-center gap-4">
            <Progress value={progress} className="flex-1" />
            <span className="text-sm text-muted-foreground w-12">{progress}%</span>
          </div>
        </div>
      </DocSection>

      <DocSection title="Variants">
        <div className="mb-4 p-6 rounded-lg border space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Default (25%)</p>
            <Progress value={25} variant="default" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-2">Success (50%)</p>
            <Progress value={50} variant="success" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-2">Warning (75%)</p>
            <Progress value={75} variant="warning" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-2">Destructive (90%)</p>
            <Progress value={90} variant="destructive" />
          </div>
        </div>
        <CodeBlock code={variantsExample} />
      </DocSection>

      <DocSection title="Sizes">
        <div className="mb-4 p-6 rounded-lg border space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Small</p>
            <Progress value={60} size="sm" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-2">Default</p>
            <Progress value={60} size="default" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-2">Large</p>
            <Progress value={60} size="lg" />
          </div>
        </div>
        <CodeBlock code={sizesExample} />
      </DocSection>

      <DocSection title="Props">
        <PropsTable props={progressProps} />
      </DocSection>
    </DocPageLayout>
  )
}
