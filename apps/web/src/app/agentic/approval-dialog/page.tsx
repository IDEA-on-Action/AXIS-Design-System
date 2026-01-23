'use client'

import { useState } from 'react'
import { Button } from '@ax/ui'
import { ApprovalCard as ApprovalDialog } from '@ax/agentic-ui'
import { CodeBlock } from '@/components/code-block'
import { PropsTable } from '@/components/props-table'
import Link from 'next/link'

const approvalDialogProps = [
  { name: 'open', type: 'boolean', required: true, description: '다이얼로그 열림 상태' },
  { name: 'onOpenChange', type: '(open: boolean) => void', default: '-', description: '열림 상태 변경 콜백' },
  { name: 'title', type: 'string', required: true, description: '다이얼로그 제목' },
  { name: 'description', type: 'string', required: true, description: '설명 텍스트' },
  { name: 'impact', type: '"low" | "medium" | "high" | "critical"', required: true, description: '위험도 수준' },
  { name: 'changes', type: 'ChangeItem[]', default: '-', description: '변경 사항 목록' },
  { name: 'onApprove', type: '() => void', required: true, description: '승인 콜백' },
  { name: 'onReject', type: '(reason?: string) => void', required: true, description: '거부 콜백' },
  { name: 'onRequestMoreInfo', type: '() => void', default: '-', description: '추가 정보 요청 콜백' },
  { name: 'timeout', type: 'number', default: '-', description: '타임아웃 (ms)' },
  { name: 'isApproving', type: 'boolean', default: 'false', description: '승인 처리 중 상태' },
]

const changeItemProps = [
  { name: 'label', type: 'string', required: true, description: '변경 항목 레이블' },
  { name: 'type', type: '"create" | "update" | "delete"', required: true, description: '변경 유형' },
  { name: 'before', type: 'string', default: '-', description: '변경 전 값' },
  { name: 'after', type: 'string', required: true, description: '변경 후 값' },
]

const basicExample = `import { ApprovalDialog } from '@ax/ui'

const changes = [
  { label: 'Button.tsx', type: 'create', after: '새 버튼 컴포넌트' },
  { label: 'index.ts', type: 'update', before: '기존 export', after: 'export 추가' },
  { label: 'old-button.tsx', type: 'delete', after: '삭제됨' },
]

export function Example() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>변경 사항 검토</Button>
      <ApprovalDialog
        open={open}
        onOpenChange={setOpen}
        title="코드 변경 승인"
        description="AI가 다음 변경 사항을 적용하려고 합니다."
        impact="medium"
        changes={changes}
        onApprove={() => { console.log('Approved'); setOpen(false) }}
        onReject={(reason) => { console.log('Rejected:', reason); setOpen(false) }}
      />
    </>
  )
}`

export default function ApprovalDialogPage() {
  const [open, setOpen] = useState(false)
  const [impact, setImpact] = useState<'low' | 'medium' | 'high' | 'critical'>('medium')

  const changes = [
    { label: 'NewFeature.tsx', type: 'create' as const, after: '새 기능 컴포넌트 추가' },
    { label: 'index.ts', type: 'update' as const, before: 'export { Button }', after: 'export { Button, NewFeature }' },
    { label: 'package.json', type: 'update' as const, before: '"version": "1.0.0"', after: '"version": "1.1.0"' },
    { label: 'deprecated.ts', type: 'delete' as const, after: '삭제됨' },
  ]

  return (
    <div className="container py-12">
      <div className="max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/agentic" className="hover:text-foreground">Agentic UI</Link>
            <span>/</span>
            <span>ApprovalDialog</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">ApprovalDialog</h1>
          <p className="text-lg text-muted-foreground">
            AI 에이전트의 작업을 사용자가 승인/거부할 수 있는 다이얼로그입니다.
            Human-in-the-Loop 패턴 구현에 사용됩니다.
          </p>
        </div>

        {/* Installation */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Installation</h2>
          <CodeBlock code="npx axis-cli add approval-dialog" language="bash" />
        </section>

        {/* Interactive Demo */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Interactive Demo</h2>
          <div className="mb-4 p-6 rounded-lg border space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm">위험도:</span>
              {(['low', 'medium', 'high', 'critical'] as const).map((level) => (
                <Button
                  key={level}
                  size="sm"
                  variant={impact === level ? 'default' : 'outline'}
                  onClick={() => setImpact(level)}
                >
                  {level}
                </Button>
              ))}
            </div>
            <Button onClick={() => setOpen(true)}>변경 사항 검토</Button>
            <ApprovalDialog
              open={open}
              onOpenChange={setOpen}
              title="코드 변경 승인 요청"
              description="AI가 다음 변경 사항을 적용하려고 합니다. 검토 후 승인 또는 거부해주세요."
              impact={impact}
              changes={changes}
              onApprove={() => {
                alert('승인되었습니다!')
                setOpen(false)
              }}
              onReject={(reason) => {
                alert(reason ? `거부됨: ${reason}` : '거부되었습니다.')
                setOpen(false)
              }}
            />
          </div>
        </section>

        {/* Usage */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Usage</h2>
          <CodeBlock code={basicExample} />
        </section>

        {/* Impact Levels */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Impact Levels</h2>
          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-xs">i</span>
                <code className="font-mono text-sm font-semibold">low</code>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">낮은 위험도 - 일반적인 작업</p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-yellow-100 text-yellow-600 text-xs">!</span>
                <code className="font-mono text-sm font-semibold">medium</code>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">중간 위험도 - 주의가 필요한 작업</p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-orange-100 text-orange-600 text-xs">!</span>
                <code className="font-mono text-sm font-semibold">high</code>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">높은 위험도 - 신중한 검토 필요</p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-red-600 text-xs">!</span>
                <code className="font-mono text-sm font-semibold">critical</code>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">심각한 위험도 - 되돌리기 어려운 작업</p>
            </div>
          </div>
        </section>

        {/* Change Types */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Change Types</h2>
          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-green-100 text-green-600 text-xs">+</span>
                <code className="font-mono text-sm font-semibold">create</code>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">새 파일/리소스 생성</p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-blue-100 text-blue-600 text-xs">~</span>
                <code className="font-mono text-sm font-semibold">update</code>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">기존 파일/리소스 수정</p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-red-100 text-red-600 text-xs">-</span>
                <code className="font-mono text-sm font-semibold">delete</code>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">파일/리소스 삭제</p>
            </div>
          </div>
        </section>

        {/* Props - ApprovalDialog */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">ApprovalDialog Props</h2>
          <PropsTable props={approvalDialogProps} />
        </section>

        {/* Props - ChangeItem */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">ChangeItem Object</h2>
          <PropsTable props={changeItemProps} />
        </section>
      </div>
    </div>
  )
}
