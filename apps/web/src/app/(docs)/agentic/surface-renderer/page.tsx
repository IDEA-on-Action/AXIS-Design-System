'use client'

import { SurfaceRenderer, type Surface } from '@axis-ds/agentic-ui'
import { CodeBlock } from '@/components/code-block'
import { DocPageLayout } from '@/components/doc-page-layout'
import { DocSection } from '@/components/doc-section'
import { PropsTable } from '@/components/props-table'

const surfaceRendererProps = [
  {
    name: 'surface',
    type: 'Surface',
    default: '-',
    description: '렌더링할 Surface 데이터',
    required: true,
  },
  {
    name: 'renderCustom',
    type: '(surface: Surface) => React.ReactNode',
    default: '-',
    description: 'type 이 "custom" 일 때 내용을 그리는 함수',
  },
  { name: 'className', type: 'string', default: '-', description: '추가 CSS 클래스' },
]

const surfaceFields = [
  { name: 'id', type: 'string', required: true, description: 'Surface 고유 식별자' },
  { name: 'type', type: 'SurfaceType', required: true, description: 'Surface 종류' },
  {
    name: 'title',
    type: 'string',
    default: '-',
    description: '머리 제목 (table 은 caption 으로도 쓰임)',
  },
  { name: 'content', type: 'unknown', required: true, description: 'type 에 맞는 내용' },
  { name: 'metadata', type: 'Record<string, unknown>', default: '-', description: '추가 정보' },
]

const surfaceTypesList = [
  { name: 'text', description: '문자열 내용을 그대로 표시' },
  { name: 'code', description: '문자열 내용을 고정폭 코드 블록으로 표시' },
  { name: 'table', description: '{ headers: string[]; rows: string[][] } 를 표로 표시' },
  { name: 'chart', description: '자리 표시자만 표시 (차트는 직접 그려야 함)' },
  { name: 'form', description: '자리 표시자만 표시 (폼은 직접 그려야 함)' },
  { name: 'custom', description: 'renderCustom 이 돌려준 내용을 표시' },
]

const textSurface: Surface = {
  id: 'surface-text',
  type: 'text',
  title: '요약',
  content: '데이터 수집이 완료되었습니다. 총 42개의 세미나가 발견되었습니다.',
}

const codeSurface: Surface = {
  id: 'surface-code',
  type: 'code',
  title: '생성된 쿼리',
  content: "SELECT title, date FROM seminars WHERE status = 'open'",
}

const tableSurface: Surface = {
  id: 'surface-table',
  type: 'table',
  title: '세미나 목록',
  content: {
    headers: ['제목', '날짜', '참석자'],
    rows: [
      ['AI 에이전트 설계', '2026-11-03', '120'],
      ['디자인 시스템 운영', '2026-11-10', '85'],
    ],
  },
}

const customSurface: Surface = {
  id: 'surface-custom',
  type: 'custom',
  title: '사용자 정의',
  content: { total: 42, open: 30 },
}

const basicExample = `import { SurfaceRenderer, type Surface } from '@axis-ds/agentic-ui'

const textSurface: Surface = {
  id: 'surface-text',
  type: 'text',
  title: '요약',
  content: '데이터 수집이 완료되었습니다. 총 42개의 세미나가 발견되었습니다.',
}

const tableSurface: Surface = {
  id: 'surface-table',
  type: 'table',
  title: '세미나 목록',
  content: {
    headers: ['제목', '날짜', '참석자'],
    rows: [
      ['AI 에이전트 설계', '2026-11-03', '120'],
      ['디자인 시스템 운영', '2026-11-10', '85'],
    ],
  },
}

export function Example() {
  return (
    <div className="space-y-4">
      <SurfaceRenderer surface={textSurface} />
      <SurfaceRenderer surface={tableSurface} />
    </div>
  )
}`

const customExample = `const customSurface: Surface = {
  id: 'surface-custom',
  type: 'custom',
  title: '사용자 정의',
  content: { total: 42, open: 30 },
}

<SurfaceRenderer
  surface={customSurface}
  renderCustom={(surface) => {
    const { total, open } = surface.content as { total: number; open: number }
    return <p className="text-sm">전체 {total}개 중 {open}개 모집 중</p>
  }}
/>`

function renderCustomSummary(surface: Surface) {
  const { total, open } = surface.content as { total: number; open: number }
  return (
    <p className="text-sm">
      전체 {total}개 중 {open}개 모집 중
    </p>
  )
}

export default function SurfaceRendererPage() {
  return (
    <DocPageLayout
      category="Agentic UI"
      categoryHref="/agentic"
      title="SurfaceRenderer"
      description="에이전트가 돌려준 Surface 데이터를 type 에 맞는 화면으로 렌더링하는 컴포넌트입니다. text · code · table 은 바로 그리고, custom 은 renderCustom 으로 그립니다."
    >
      <DocSection title="Installation">
        <CodeBlock code="npx @axis-ds/cli add surface-renderer" language="bash" />
      </DocSection>

      <DocSection title="Usage">
        <div className="mb-4 p-6 rounded-lg border space-y-4">
          <SurfaceRenderer surface={textSurface} />
          <SurfaceRenderer surface={tableSurface} />
        </div>
        <CodeBlock code={basicExample} />
      </DocSection>

      <DocSection title="Code Surface">
        <div className="mb-4 p-6 rounded-lg border">
          <SurfaceRenderer surface={codeSurface} />
        </div>
      </DocSection>

      <DocSection title="Custom Surface">
        <div className="mb-4 p-6 rounded-lg border">
          <SurfaceRenderer surface={customSurface} renderCustom={renderCustomSummary} />
        </div>
        <CodeBlock code={customExample} />
      </DocSection>

      <DocSection title="Surface Types">
        <p className="text-muted-foreground mb-4">
          아래 6가지 type 만 렌더링합니다. 그 밖의 값은 아무것도 그리지 않습니다.
        </p>
        <div className="grid gap-2">
          {surfaceTypesList.map(type => (
            <div key={type.name} className="flex items-center gap-3 rounded-lg border p-3">
              <code className="font-mono text-sm font-semibold text-primary">{type.name}</code>
              <span className="text-sm text-muted-foreground">{type.description}</span>
            </div>
          ))}
        </div>
      </DocSection>

      <DocSection title="Props">
        <PropsTable props={surfaceRendererProps} />
      </DocSection>

      <DocSection title="Surface Type">
        <PropsTable props={surfaceFields} />
        <CodeBlock
          code={`type SurfaceType = 'text' | 'code' | 'table' | 'chart' | 'form' | 'custom'`}
        />
      </DocSection>

      <DocSection title="Accessibility">
        <p className="mb-4 text-muted-foreground">
          {
            'table surface 는 role="table" 과 scope="col" 머리글로 마크업되고, title 이 있으면 화면에 보이지 않는 caption 으로도 전달됩니다.'
          }
        </p>
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li key={0}>{'custom surface 의 접근성은 renderCustom 이 그린 내용이 책임집니다.'}</li>
        </ul>
      </DocSection>
    </DocPageLayout>
  )
}
