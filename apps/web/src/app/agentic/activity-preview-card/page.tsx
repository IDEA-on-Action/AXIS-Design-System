'use client'

import { ActivityPreviewCard } from '@ax/ui'
import { CodeBlock } from '@/components/code-block'
import { PropsTable } from '@/components/props-table'
import Link from 'next/link'

const activityPreviewCardProps = [
  { name: 'activity', type: 'ActivityData', default: '-', description: 'Activity 데이터 객체', required: true },
  { name: 'onEdit', type: '() => void', default: '-', description: '수정 버튼 클릭 핸들러' },
  { name: 'variant', type: '"default" | "compact"', default: '"default"', description: '카드 변형' },
  { name: 'className', type: 'string', default: '-', description: '추가 CSS 클래스' },
]

const activityDataProps = [
  { name: 'activity_id', type: 'string', default: '-', description: 'Activity 고유 ID', required: true },
  { name: 'title', type: 'string', default: '-', description: '세미나/이벤트 제목', required: true },
  { name: 'date', type: 'string | null', default: 'null', description: '일시' },
  { name: 'organizer', type: 'string | null', default: 'null', description: '주최자' },
  { name: 'url', type: 'string', default: '-', description: '원본 URL', required: true },
  { name: 'play_id', type: 'string', default: '-', description: 'Play DB ID', required: true },
  { name: 'themes', type: 'string[]', default: '[]', description: '테마/카테고리 목록' },
  { name: 'source', type: 'string', default: '-', description: '데이터 소스 (KT, 그룹사, 대외)', required: true },
  { name: 'channel', type: 'string', default: '-', description: '수집 채널', required: true },
  { name: 'status', type: 'string', default: '-', description: '상태', required: true },
]

const basicExample = `import { ActivityPreviewCard } from '@ax/ui'

const activity = {
  activity_id: 'ACT-2024-001',
  title: 'AI/LLM 기술 세미나',
  date: '2024-03-15',
  organizer: 'KT AI Lab',
  url: 'https://example.com/seminar',
  play_id: 'PLAY-001',
  themes: ['AI', 'LLM', 'Enterprise'],
  source: 'KT',
  channel: '자사활동',
  status: 'collected',
}

export function Example() {
  return (
    <ActivityPreviewCard
      activity={activity}
      onEdit={() => console.log('Edit clicked')}
    />
  )
}`

const compactExample = `<ActivityPreviewCard
  activity={activity}
  variant="compact"
/>`

const sampleActivity = {
  activity_id: 'ACT-2024-001',
  title: 'AI/LLM 기반 엔터프라이즈 솔루션 세미나',
  date: '2024-03-15 14:00',
  organizer: 'KT AI Innovation Lab',
  url: 'https://example.com/seminar',
  play_id: 'PLAY-AI-001',
  themes: ['AI', 'LLM', 'Enterprise', 'Cloud'],
  source: 'KT',
  channel: '자사활동',
  status: 'collected',
}

const sampleActivity2 = {
  activity_id: 'ACT-2024-002',
  title: 'DevOps & Cloud Native 워크샵',
  date: '2024-03-20',
  organizer: 'AWS Korea',
  url: 'https://example.com/workshop',
  play_id: 'PLAY-CLOUD-002',
  themes: ['DevOps', 'Kubernetes', 'Cloud'],
  source: '대외',
  channel: '데스크리서치',
  status: 'pending',
}

export default function ActivityPreviewCardPage() {
  return (
    <div className="container py-12">
      <div className="max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/agentic" className="hover:text-foreground">Agentic UI</Link>
            <span>/</span>
            <span>ActivityPreviewCard</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">ActivityPreviewCard</h1>
          <p className="text-lg text-muted-foreground">
            Activity 정보를 미리보기 형태로 표시하는 카드 컴포넌트입니다.
            WF-01 세미나 파이프라인 결과 표시에 사용됩니다.
          </p>
        </div>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Installation</h2>
          <CodeBlock code="npx axis-cli add activity-preview-card" language="bash" />
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Usage</h2>
          <div className="mb-4 p-6 rounded-lg border bg-muted/30">
            <ActivityPreviewCard
              activity={sampleActivity}
              onEdit={() => alert('수정 버튼 클릭')}
            />
          </div>
          <CodeBlock code={basicExample} />
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Variants</h2>
          <div className="space-y-4 mb-4">
            <div className="rounded-lg border p-4">
              <p className="text-sm font-medium mb-3">Default</p>
              <ActivityPreviewCard activity={sampleActivity2} />
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm font-medium mb-3">Compact</p>
              <ActivityPreviewCard activity={sampleActivity2} variant="compact" />
            </div>
          </div>
          <CodeBlock code={compactExample} />
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Multiple Cards</h2>
          <div className="mb-4 p-6 rounded-lg border bg-muted/30 space-y-4">
            <ActivityPreviewCard activity={sampleActivity} />
            <ActivityPreviewCard activity={sampleActivity2} />
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Props</h2>
          <PropsTable props={activityPreviewCardProps} />
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">ActivityData Interface</h2>
          <PropsTable props={activityDataProps} />
        </section>
      </div>
    </div>
  )
}
