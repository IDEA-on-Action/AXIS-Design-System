'use client'

import { CodeBlock } from '@/components/code-block'
import { DocPageLayout } from '@/components/doc-page-layout'
import { DocSection } from '@/components/doc-section'
import { PropsTable } from '@/components/props-table'

// Mock Skeleton 컴포넌트
const Skeleton = ({ className = '' }: any) => (
  <div className={`animate-pulse rounded-md bg-muted ${className}`} />
)

const skeletonProps = [
  {
    name: 'className',
    type: 'string',
    default: '-',
    description: '크기 및 모양을 지정하는 CSS 클래스',
  },
]

const basicExample = `import { Skeleton } from '@axis-ds/ui-react'

export function Example() {
  return <Skeleton className="h-4 w-[250px]" />
}`

const cardExample = `// 카드 로딩 상태
<div className="flex items-center space-x-4">
  <Skeleton className="h-12 w-12 rounded-full" />
  <div className="space-y-2">
    <Skeleton className="h-4 w-[250px]" />
    <Skeleton className="h-4 w-[200px]" />
  </div>
</div>`

const tableExample = `// 테이블 로딩 상태
<div className="space-y-3">
  <Skeleton className="h-8 w-full" />
  <Skeleton className="h-8 w-full" />
  <Skeleton className="h-8 w-full" />
</div>`

export default function SkeletonPage() {
  return (
    <DocPageLayout
      category="Components"
      categoryHref="/components"
      title="Skeleton"
      description="콘텐츠 로딩 상태를 표시하는 플레이스홀더 컴포넌트입니다."
    >
      <DocSection title="Installation">
        <CodeBlock code="npx axis-cli add skeleton" language="bash" />
      </DocSection>

      <DocSection title="Usage">
        <CodeBlock code={basicExample} />
      </DocSection>

      <DocSection title="Basic">
        <div className="mb-4 p-6 rounded-lg border space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </DocSection>

      <DocSection title="Card Loading">
        <div className="mb-4 p-6 rounded-lg border">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
        </div>
        <CodeBlock code={cardExample} />
      </DocSection>

      <DocSection title="Table Loading">
        <div className="mb-4 p-6 rounded-lg border">
          <div className="space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </div>
        <CodeBlock code={tableExample} />
      </DocSection>

      <DocSection title="Complex Layout">
        <div className="mb-4 p-6 rounded-lg border">
          <div className="space-y-4">
            <div className="flex gap-4">
              <Skeleton className="h-40 w-40 rounded-lg" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          </div>
        </div>
      </DocSection>

      <DocSection title="Props">
        <PropsTable props={skeletonProps} />
      </DocSection>

      <DocSection title="Accessibility">
        <p className="mb-4 text-muted-foreground">
          {'콘텐츠 로딩 중 표시되는 장식적 플레이스홀더입니다.'}
        </p>
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li key={0}>
            {
              '스켈레톤 자체는 장식이므로 보조기술에서 숨기고, 로딩 영역에 aria-busy="true"를 적용하세요.'
            }
          </li>
          <li key={1}>{'로딩 완료 시 실제 콘텐츠로 교체해 상태 변화를 알리세요.'}</li>
        </ul>
      </DocSection>
    </DocPageLayout>
  )
}
