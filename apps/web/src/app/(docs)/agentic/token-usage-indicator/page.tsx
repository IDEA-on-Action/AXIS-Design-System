'use client'

import { useState } from 'react'
import { CodeBlock } from '@/components/code-block'
import { DocPageLayout } from '@/components/doc-page-layout'
import { DocSection } from '@/components/doc-section'
import { PropsTable } from '@/components/props-table'

const TokenUsageIndicator = ({
  current,
  max,
  cost,
  warningThreshold = 0.8,
  compact = false,
}: {
  current: number
  max: number
  cost?: number
  warningThreshold?: number
  compact?: boolean
}) => {
  const ratio = Math.min(current / max, 1)
  const isWarning = ratio >= warningThreshold
  const isCritical = ratio >= 0.95

  const barColor = isCritical ? 'bg-red-500' : isWarning ? 'bg-yellow-500' : 'bg-primary'

  const formatNumber = (n: number) => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
    return n.toString()
  }

  if (compact) {
    return (
      <div className="inline-flex items-center gap-2 text-xs">
        <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${barColor}`}
            style={{ width: `${ratio * 100}%` }}
          />
        </div>
        <span className="text-muted-foreground">
          {formatNumber(current)}/{formatNumber(max)}
        </span>
      </div>
    )
  }

  return (
    <div className="rounded-lg border p-3 space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">토큰 사용량</span>
        <span className="text-muted-foreground">
          {formatNumber(current)} / {formatNumber(max)}
        </span>
      </div>
      <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{(ratio * 100).toFixed(1)}% 사용</span>
        {cost !== undefined && <span>${cost.toFixed(4)}</span>}
      </div>
      {isCritical && (
        <p className="text-xs text-red-500 font-medium">⚠ 토큰 한도에 거의 도달했습니다.</p>
      )}
    </div>
  )
}

const tokenUsageProps = [
  { name: 'current', type: 'number', required: true, description: '현재 사용된 토큰 수' },
  { name: 'max', type: 'number', required: true, description: '최대 토큰 한도' },
  { name: 'cost', type: 'number', default: '-', description: '비용 (USD)' },
  { name: 'warningThreshold', type: 'number', default: '0.8', description: '경고 임계값 (0-1)' },
  { name: 'compact', type: 'boolean', default: 'false', description: '컴팩트 모드' },
  { name: 'className', type: 'string', default: '-', description: '추가 CSS 클래스' },
]

const basicExample = `import { TokenUsageIndicator } from '@axis-ds/agentic-ui'

export function Example() {
  return (
    <TokenUsageIndicator
      current={3200}
      max={4096}
      cost={0.0064}
      warningThreshold={0.8}
    />
  )
}`

export default function TokenUsageIndicatorPage() {
  const [current, setCurrent] = useState(2500)
  const max = 4096

  return (
    <DocPageLayout
      category="Agentic UI"
      categoryHref="/agentic"
      title="TokenUsageIndicator"
      description="AI 모델의 토큰 사용량을 시각적으로 표시하는 컴포넌트입니다."
    >
      <DocSection title="Installation">
        <CodeBlock code="npx axis-cli add token-usage-indicator --agentic" language="bash" />
      </DocSection>

      <DocSection title="Usage">
        <CodeBlock code={basicExample} />
      </DocSection>

      <DocSection title="Interactive Demo">
        <div className="mb-4 p-6 rounded-lg border space-y-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">토큰: {current}</label>
            <input
              type="range"
              min={0}
              max={max}
              value={current}
              onChange={e => setCurrent(Number(e.target.value))}
              className="flex-1"
            />
          </div>
          <TokenUsageIndicator current={current} max={max} cost={current * 0.000002} />
        </div>
      </DocSection>

      <DocSection title="Modes">
        <div className="mb-4 p-6 rounded-lg border space-y-6">
          <div>
            <p className="text-sm font-medium mb-2">Full (기본)</p>
            <TokenUsageIndicator current={2800} max={4096} cost={0.0056} />
          </div>
          <div>
            <p className="text-sm font-medium mb-2">Compact</p>
            <TokenUsageIndicator current={2800} max={4096} compact />
          </div>
        </div>
      </DocSection>

      <DocSection title="States">
        <div className="mb-4 p-6 rounded-lg border space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">Normal (50%)</p>
            <TokenUsageIndicator current={2048} max={4096} />
          </div>
          <div>
            <p className="text-sm font-medium mb-2">Warning (85%)</p>
            <TokenUsageIndicator current={3480} max={4096} />
          </div>
          <div>
            <p className="text-sm font-medium mb-2">Critical (98%)</p>
            <TokenUsageIndicator current={4015} max={4096} />
          </div>
        </div>
      </DocSection>

      <DocSection title="Props">
        <PropsTable props={tokenUsageProps} />
      </DocSection>

      <DocSection title="Accessibility">
        <p className="mb-4 text-muted-foreground">
          {'사용량을 role="meter" + aria-valuenow / aria-valuemin / aria-valuemax로 전달합니다.'}
        </p>
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li key={0}>{'수치가 aria-label로 보조기술에 접근 가능하게 노출됩니다.'}</li>
        </ul>
      </DocSection>
    </DocPageLayout>
  )
}
