'use client'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@axis-ds/ui-react'
import { CodeBlock } from '@/components/code-block'
import { DocPageLayout } from '@/components/doc-page-layout'
import { DocSection } from '@/components/doc-section'
import { KeyboardTable } from '@/components/keyboard-table'
import { PropsTable } from '@/components/props-table'

const breadcrumbProps = [
  {
    name: 'separator',
    type: 'React.ReactNode',
    default: '"/"',
    description: '구분자 커스터마이징',
  },
  { name: 'children', type: 'React.ReactNode', default: '-', description: '브레드크럼 내용' },
  { name: 'className', type: 'string', default: '-', description: '추가 CSS 클래스' },
]

const basicExample = `import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@axis-ds/ui-react'

export function Example() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/">홈</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="/components">컴포넌트</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}`

export default function BreadcrumbPage_() {
  return (
    <DocPageLayout
      category="Components"
      categoryHref="/components"
      title="Breadcrumb"
      description="현재 페이지의 경로를 탐색할 수 있는 브레드크럼 컴포넌트입니다."
    >
      <DocSection title="Installation">
        <CodeBlock code="npx axis-cli add breadcrumb" language="bash" />
      </DocSection>

      <DocSection title="Usage">
        <div className="mb-4 p-6 rounded-lg border">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">홈</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/components">컴포넌트</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <CodeBlock code={basicExample} />
      </DocSection>

      <DocSection title="Components">
        <div className="space-y-4">
          <div className="rounded-lg border p-4">
            <code className="font-mono text-sm font-semibold">Breadcrumb</code>
            <p className="mt-1 text-sm text-muted-foreground">브레드크럼 루트 (nav 요소)</p>
          </div>
          <div className="rounded-lg border p-4">
            <code className="font-mono text-sm font-semibold">BreadcrumbList</code>
            <p className="mt-1 text-sm text-muted-foreground">브레드크럼 목록 (ol 요소)</p>
          </div>
          <div className="rounded-lg border p-4">
            <code className="font-mono text-sm font-semibold">BreadcrumbItem</code>
            <p className="mt-1 text-sm text-muted-foreground">개별 브레드크럼 아이템 (li 요소)</p>
          </div>
          <div className="rounded-lg border p-4">
            <code className="font-mono text-sm font-semibold">BreadcrumbLink</code>
            <p className="mt-1 text-sm text-muted-foreground">탐색 가능한 링크</p>
          </div>
          <div className="rounded-lg border p-4">
            <code className="font-mono text-sm font-semibold">BreadcrumbPage</code>
            <p className="mt-1 text-sm text-muted-foreground">현재 페이지 (링크 없음)</p>
          </div>
          <div className="rounded-lg border p-4">
            <code className="font-mono text-sm font-semibold">BreadcrumbSeparator</code>
            <p className="mt-1 text-sm text-muted-foreground">아이템 간 구분자</p>
          </div>
        </div>
      </DocSection>

      <DocSection title="Props">
        <PropsTable props={breadcrumbProps} />
      </DocSection>

      <DocSection title="Accessibility">
        <p className="mb-4 text-muted-foreground">
          {'nav 랜드마크와 정렬 목록으로 구성된 탐색 경로입니다.'}
        </p>
        <KeyboardTable keys={[{ key: 'Tab', description: '경로 내 링크 사이를 이동합니다.' }]} />
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li key={0}>
            {'nav 요소에 접근 가능한 이름(예: aria-label="Breadcrumb")을 제공하세요.'}
          </li>
          <li key={1}>{'현재 페이지 항목에는 aria-current="page"를 지정하세요.'}</li>
        </ul>
      </DocSection>
    </DocPageLayout>
  )
}
