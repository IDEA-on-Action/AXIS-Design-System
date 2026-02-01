'use client'

import { useState } from 'react'
import { Button } from '@axis-ds/ui-react'
import { CodeBlock } from '@/components/code-block'
import { PropsTable } from '@/components/props-table'
import Link from 'next/link'

// Mock RecoveryBanner 컴포넌트
const RecoveryBanner = ({ message, description, onRetry, onDismiss }: any) => (
  <div className="flex items-start gap-3 p-4 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20" role="alert">
    <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-red-700 dark:text-red-400">{message}</p>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      )}
      <div className="flex gap-2 mt-3">
        {onRetry && (
          <Button size="sm" variant="destructive" onClick={onRetry}>재시도</Button>
        )}
        {onDismiss && (
          <Button size="sm" variant="ghost" onClick={onDismiss}>무시</Button>
        )}
      </div>
    </div>
  </div>
)

const recoveryBannerProps = [
  { name: 'message', type: 'string', required: true, description: '에러 메시지' },
  { name: 'description', type: 'string', default: '-', description: '상세 설명' },
  { name: 'onRetry', type: '() => void', default: '-', description: '재시도 버튼 클릭 콜백' },
  { name: 'onDismiss', type: '() => void', default: '-', description: '무시 버튼 클릭 콜백' },
  { name: 'className', type: 'string', default: '-', description: '추가 CSS 클래스' },
]

const basicExample = `import { RecoveryBanner } from '@axis-ds/agentic-ui'

export function Example() {
  return (
    <RecoveryBanner
      message="API 요청 실패"
      description="서버에서 응답을 받지 못했습니다. 잠시 후 다시 시도해 주세요."
      onRetry={() => console.log('재시도')}
      onDismiss={() => console.log('무시')}
    />
  )
}`

export default function RecoveryBannerPage() {
  const [showBanner, setShowBanner] = useState(true)
  const [retryCount, setRetryCount] = useState(0)

  const handleRetry = () => {
    setRetryCount(prev => prev + 1)
  }

  const handleDismiss = () => {
    setShowBanner(false)
  }

  return (
    <div className="container py-12">
      <div className="max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/agentic" className="hover:text-foreground">Agentic UI</Link>
            <span>/</span>
            <span>RecoveryBanner</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">RecoveryBanner</h1>
          <p className="text-lg text-muted-foreground">
            에러 발생 시 복구 옵션을 제공하는 배너 컴포넌트입니다. 재시도 및 무시 액션을 지원합니다.
          </p>
        </div>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Installation</h2>
          <CodeBlock code="npx axis-cli add recovery-banner --agentic" language="bash" />
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Interactive Demo</h2>
          <div className="mb-4 p-6 rounded-lg border space-y-4">
            {!showBanner && (
              <Button onClick={() => setShowBanner(true)}>배너 다시 표시</Button>
            )}
            {showBanner && (
              <RecoveryBanner
                message="API 요청에 실패했습니다"
                description={`네트워크 오류가 발생했습니다. 재시도 횟수: ${retryCount}회`}
                onRetry={handleRetry}
                onDismiss={handleDismiss}
              />
            )}
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Variants</h2>
          <div className="space-y-4 p-6 rounded-lg border">
            <div>
              <p className="text-sm font-medium mb-2">기본</p>
              <RecoveryBanner
                message="작업 실패"
                onRetry={() => {}}
              />
            </div>
            <div>
              <p className="text-sm font-medium mb-2">설명 포함</p>
              <RecoveryBanner
                message="데이터 로드 실패"
                description="서버 연결이 불안정합니다. 네트워크 연결을 확인해 주세요."
                onRetry={() => {}}
                onDismiss={() => {}}
              />
            </div>
            <div>
              <p className="text-sm font-medium mb-2">재시도만</p>
              <RecoveryBanner
                message="인증 만료"
                description="세션이 만료되었습니다."
                onRetry={() => {}}
              />
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Usage</h2>
          <CodeBlock code={basicExample} />
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Props</h2>
          <PropsTable props={recoveryBannerProps} />
        </section>
      </div>
    </div>
  )
}
