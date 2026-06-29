'use client'

import { Button } from '@axis-ds/ui-react'
import { CodeBlock } from '@/components/code-block'
import { DocPageLayout } from '@/components/doc-page-layout'
import { DocSection } from '@/components/doc-section'
import { PropsTable } from '@/components/props-table'

const toastProps = [
  { name: 'message', type: 'string', default: '-', description: '토스트 메시지' },
  { name: 'description', type: 'string', default: '-', description: '추가 설명 (옵션)' },
  { name: 'duration', type: 'number', default: '4000', description: '표시 시간 (ms)' },
  { name: 'action', type: '{ label, onClick }', default: '-', description: '액션 버튼' },
]

const basicExample = `import { toast } from '@axis-ds/ui-react'
import { Button } from '@axis-ds/ui-react'

export function Example() {
  return (
    <Button
      onClick={() => {
        toast("작업이 완료되었습니다.")
      }}
    >
      토스트 표시
    </Button>
  )
}`

const variantsExample = `// Default
toast("알림 메시지입니다.")

// Success
toast.success("성공적으로 저장되었습니다.")

// Error
toast.error("문제가 발생했습니다.")

// With description
toast("알림", {
  description: "상세 설명을 추가할 수 있습니다.",
})`

const withActionExample = `toast("파일이 삭제되었습니다.", {
  action: {
    label: "실행 취소",
    onClick: () => console.log("Undo"),
  },
})`

export default function ToastPage() {
  // 데모용 간단한 toast 함수
  const showToast = (message: string, type?: 'success' | 'error') => {
    alert(`[${type || 'info'}] ${message}`)
  }

  return (
    <DocPageLayout
      category="Components"
      categoryHref="/components"
      title="Toast"
      description="사용자에게 피드백을 제공하는 알림 메시지 컴포넌트입니다."
    >
      <DocSection title="Installation">
        <CodeBlock code="npx axis-cli add toast" language="bash" />
      </DocSection>

      <DocSection title="Usage">
        <div className="mb-4 p-6 rounded-lg border space-x-2">
          <Button onClick={() => showToast('작업이 완료되었습니다.')}>기본 토스트</Button>
          <Button
            variant="outline"
            onClick={() => showToast('성공적으로 저장되었습니다.', 'success')}
          >
            성공 토스트
          </Button>
          <Button variant="destructive" onClick={() => showToast('문제가 발생했습니다.', 'error')}>
            에러 토스트
          </Button>
        </div>
        <CodeBlock code={basicExample} />
      </DocSection>

      <DocSection title="Variants">
        <CodeBlock code={variantsExample} />
      </DocSection>

      <DocSection title="With Action">
        <CodeBlock code={withActionExample} />
      </DocSection>

      <DocSection title="Setup">
        <p className="text-muted-foreground mb-4">앱 루트에 Toaster 컴포넌트를 추가해야 합니다.</p>
        <CodeBlock
          code={`// app/layout.tsx
import { Toaster } from '@axis-ds/ui-react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  )
}`}
        />
      </DocSection>

      <DocSection title="Props">
        <PropsTable props={toastProps} />
      </DocSection>
    </DocPageLayout>
  )
}
