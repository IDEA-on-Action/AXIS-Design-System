'use client'

import { CollectorHealthBar } from '@ax/ui'
import { CodeBlock } from '@/components/code-block'
import { PropsTable } from '@/components/props-table'
import Link from 'next/link'
import { useState } from 'react'

const collectorHealthBarProps = [
  { name: 'data', type: 'HealthCheckData | null', default: '-', description: '헬스체크 데이터', required: true },
  { name: 'isLoading', type: 'boolean', default: 'false', description: '로딩 상태' },
  { name: 'onRefresh', type: '() => void', default: '-', description: '새로고침 핸들러' },
  { name: 'className', type: 'string', default: '-', description: '추가 CSS 클래스' },
]

const healthCheckDataProps = [
  { name: 'checked_at', type: 'string', default: '-', description: '확인 시각 (ISO 8601)', required: true },
  { name: 'results', type: 'CollectorHealthResult[]', default: '-', description: '수집기별 결과', required: true },
  { name: 'summary', type: 'object', default: '-', description: '요약 정보 (total, healthy, degraded, unhealthy)', required: true },
]

const collectorHealthResultProps = [
  { name: 'collector_name', type: 'string', default: '-', description: '수집기 이름', required: true },
  { name: 'status', type: '"healthy" | "degraded" | "unhealthy"', default: '-', description: '상태', required: true },
  { name: 'checked_at', type: 'string', default: '-', description: '확인 시각', required: true },
  { name: 'sample_count', type: 'number', default: '-', description: '수집된 샘플 수', required: true },
  { name: 'error_message', type: 'string | null', default: 'null', description: '오류 메시지' },
  { name: 'response_time_ms', type: 'number | null', default: 'null', description: '응답 시간 (ms)' },
]

const basicExample = `import { CollectorHealthBar } from '@ax/ui'

const healthData = {
  checked_at: '2024-03-15T10:30:00Z',
  results: [
    { collector_name: 'onoffmix', status: 'healthy', checked_at: '...', sample_count: 45, error_message: null, response_time_ms: 120 },
    { collector_name: 'eventus', status: 'healthy', checked_at: '...', sample_count: 32, error_message: null, response_time_ms: 85 },
    { collector_name: 'festa', status: 'degraded', checked_at: '...', sample_count: 12, error_message: '일부 데이터 누락', response_time_ms: 340 },
  ],
  summary: { total: 3, healthy: 2, degraded: 1, unhealthy: 0 }
}

export function Example() {
  return (
    <CollectorHealthBar
      data={healthData}
      onRefresh={() => console.log('새로고침')}
    />
  )
}`

const healthyData = {
  checked_at: new Date().toISOString(),
  results: [
    { collector_name: 'onoffmix', status: 'healthy' as const, checked_at: new Date().toISOString(), sample_count: 45, error_message: null, response_time_ms: 120 },
    { collector_name: 'eventus', status: 'healthy' as const, checked_at: new Date().toISOString(), sample_count: 32, error_message: null, response_time_ms: 85 },
    { collector_name: 'festa', status: 'healthy' as const, checked_at: new Date().toISOString(), sample_count: 28, error_message: null, response_time_ms: 95 },
  ],
  summary: { total: 3, healthy: 3, degraded: 0, unhealthy: 0 }
}

const degradedData = {
  checked_at: new Date().toISOString(),
  results: [
    { collector_name: 'onoffmix', status: 'healthy' as const, checked_at: new Date().toISOString(), sample_count: 45, error_message: null, response_time_ms: 120 },
    { collector_name: 'eventus', status: 'degraded' as const, checked_at: new Date().toISOString(), sample_count: 12, error_message: '응답 지연 발생', response_time_ms: 850 },
    { collector_name: 'festa', status: 'healthy' as const, checked_at: new Date().toISOString(), sample_count: 28, error_message: null, response_time_ms: 95 },
  ],
  summary: { total: 3, healthy: 2, degraded: 1, unhealthy: 0 }
}

const unhealthyData = {
  checked_at: new Date().toISOString(),
  results: [
    { collector_name: 'onoffmix', status: 'healthy' as const, checked_at: new Date().toISOString(), sample_count: 45, error_message: null, response_time_ms: 120 },
    { collector_name: 'eventus', status: 'unhealthy' as const, checked_at: new Date().toISOString(), sample_count: 0, error_message: '연결 실패: ECONNREFUSED', response_time_ms: null },
    { collector_name: 'festa', status: 'degraded' as const, checked_at: new Date().toISOString(), sample_count: 8, error_message: '일부 데이터 누락', response_time_ms: 450 },
  ],
  summary: { total: 3, healthy: 1, degraded: 1, unhealthy: 1 }
}

export default function CollectorHealthBarPage() {
  const [isLoading, setIsLoading] = useState(false)

  const handleRefresh = () => {
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 1500)
  }

  return (
    <div className="container py-12">
      <div className="max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/agentic" className="hover:text-foreground">Agentic UI</Link>
            <span>/</span>
            <span>CollectorHealthBar</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">CollectorHealthBar</h1>
          <p className="text-lg text-muted-foreground">
            데이터 수집기의 상태를 한눈에 보여주는 헬스바 컴포넌트입니다.
            각 수집기의 정상/저하/오류 상태를 실시간으로 모니터링합니다.
          </p>
        </div>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Installation</h2>
          <CodeBlock code="npx axis-cli add collector-health-bar" language="bash" />
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Usage</h2>
          <div className="mb-4 p-6 rounded-lg border bg-muted/30">
            <CollectorHealthBar
              data={healthyData}
              isLoading={isLoading}
              onRefresh={handleRefresh}
            />
          </div>
          <CodeBlock code={basicExample} />
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Status Variants</h2>
          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <p className="text-sm font-medium mb-3">Healthy (모든 수집기 정상)</p>
              <CollectorHealthBar data={healthyData} />
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm font-medium mb-3">Degraded (일부 저하)</p>
              <CollectorHealthBar data={degradedData} />
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm font-medium mb-3">Unhealthy (오류 발생)</p>
              <CollectorHealthBar data={unhealthyData} />
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Loading State</h2>
          <div className="mb-4 p-6 rounded-lg border bg-muted/30">
            <CollectorHealthBar
              data={null}
              isLoading={true}
            />
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Props</h2>
          <PropsTable props={collectorHealthBarProps} />
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">HealthCheckData Interface</h2>
          <PropsTable props={healthCheckDataProps} />
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">CollectorHealthResult Interface</h2>
          <PropsTable props={collectorHealthResultProps} />
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">HealthStatus Type</h2>
          <CodeBlock code={`type HealthStatus = 'healthy' | 'degraded' | 'unhealthy'`} />
        </section>
      </div>
    </div>
  )
}
