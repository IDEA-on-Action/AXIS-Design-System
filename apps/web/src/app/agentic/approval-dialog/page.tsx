'use client'

import { useState } from 'react'
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@axis-ds/ui-react'
import { CodeBlock } from '@/components/code-block'
import { PropsTable } from '@/components/props-table'
import Link from 'next/link'

type Impact = 'low' | 'medium' | 'high' | 'critical'

interface ChangeItem {
  label: string
  type: 'create' | 'update' | 'delete'
  before?: string
  after: string
}

// Mock ApprovalDialog 컴포넌트
const ApprovalDialog = ({
  open,
  onOpenChange,
  title,
  description,
  impact,
  changes,
  onApprove,
  onReject
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  impact: Impact
  changes: ChangeItem[]
  onApprove: () => void
  onReject: (reason?: string) => void
}) => {
  const impactColors: Record<Impact, string> = {
    low: 'bg-blue-100 text-blue-700',
    medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-orange-100 text-orange-700',
    critical: 'bg-red-100 text-red-700'
  }

  const typeIcons: Record<ChangeItem['type'], string> = {
    create: '+',
    update: '~',
    delete: '-'
  }

  const typeColors: Record<ChangeItem['type'], string> = {
    create: 'bg-green-100 text-green-600',
    update: 'bg-blue-100 text-blue-600',
    delete: 'bg-red-100 text-red-600'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>{title}</DialogTitle>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${impactColors[impact]}`}>
              {impact}
            </span>
          </div>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2 my-4">
          <h4 className="text-sm font-medium">변경 사항</h4>
          {changes.map((change, i) => (
            <div key={i} className="flex items-start gap-2 p-2 rounded bg-muted/50">
              <span className={`w-5 h-5 flex items-center justify-center rounded text-xs ${typeColors[change.type]}`}>
                {typeIcons[change.type]}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{change.label}</p>
                {change.type === 'update' && change.before && (
                  <p className="text-xs text-muted-foreground line-through">{change.before}</p>
                )}
                <p className="text-xs text-muted-foreground">{change.after}</p>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onReject()}>
            거부
          </Button>
          <Button onClick={onApprove}>
            승인
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const approvalDialogProps = [
  { name: 'open', type: 'boolean', required: true, description: '다이얼로그 열림 상태' },
  { name: 'onOpenChange', type: '(open: boolean) => void', default: '-', description: '열림 상태 변경 콜백' },
  { name: 'title', type: 'string', required: true, description: '다이얼로그 제목' },
  { name: 'description', type: 'string', required: true, description: '설명 텍스트' },
  { name: 'impact', type: '"low" | "medium" | "high" | "critical"', required: true, description: '위험도 수준' },
  { name: 'changes', type: 'ChangeItem[]', default: '-', description: '변경 사항 목록' },
  { name: 'onApprove', type: '() => void', required: true, description: '승인 콜백' },
  { name: 'onReject', type: '(reason?: string) => void', required: true, description: '거부 콜백' },
]

const basicExample = `import { ApprovalCard } from '@axis-ds/agentic-ui'

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
  const [impact, setImpact] = useState<Impact>('medium')

  const changes: ChangeItem[] = [
    { label: 'NewFeature.tsx', type: 'create', after: '새 기능 컴포넌트 추가' },
    { label: 'index.ts', type: 'update', before: 'export { Button }', after: 'export { Button, NewFeature }' },
    { label: 'package.json', type: 'update', before: '"version": "1.0.0"', after: '"version": "1.1.0"' },
    { label: 'deprecated.ts', type: 'delete', after: '삭제됨' },
  ]

  return (
    <div className="container py-12">
      <div className="max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/agentic" className="hover:text-foreground">Agentic UI</Link>
            <span>/</span>
            <span>ApprovalCard</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">ApprovalCard</h1>
          <p className="text-lg text-muted-foreground">
            AI 에이전트의 작업을 사용자가 승인/거부할 수 있는 컴포넌트입니다.
            Human-in-the-Loop 패턴 구현에 사용됩니다.
          </p>
        </div>

        {/* Installation */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Installation</h2>
          <CodeBlock code="npx axis-cli add approval-card" language="bash" />
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

        {/* Props */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Props</h2>
          <PropsTable props={approvalDialogProps} />
        </section>
      </div>
    </div>
  )
}
