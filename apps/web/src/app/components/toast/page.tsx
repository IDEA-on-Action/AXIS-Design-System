'use client'

import { Button } from '@ax/ui'
import { toast } from '@ax/ui'
import { CodeBlock } from '@/components/code-block'
import { PropsTable } from '@/components/props-table'
import Link from 'next/link'

const toastProps = [
  { name: 'message', type: 'string', default: '-', description: '토스트 메시지' },
  { name: 'description', type: 'string', default: '-', description: '추가 설명 (옵션)' },
  { name: 'duration', type: 'number', default: '4000', description: '표시 시간 (ms)' },
  { name: 'action', type: '{ label, onClick }', default: '-', description: '액션 버튼' },
]

const basicExample = `import { toast } from '@ax/ui'
import { Button } from '@ax/ui'

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
  return (
    <div className="container py-12">
      <div className="max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/components" className="hover:text-foreground">Components</Link>
            <span>/</span>
            <span>Toast</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">Toast</h1>
          <p className="text-lg text-muted-foreground">
            사용자에게 피드백을 제공하는 알림 메시지 컴포넌트입니다.
          </p>
        </div>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Installation</h2>
          <CodeBlock code="npx axis-cli add toast" language="bash" />
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Usage</h2>
          <div className="mb-4 p-6 rounded-lg border space-x-2">
            <Button
              onClick={() => {
                toast("작업이 완료되었습니다.")
              }}
            >
              기본 토스트
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                toast.success("성공적으로 저장되었습니다.")
              }}
            >
              성공 토스트
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                toast.error("문제가 발생했습니다.")
              }}
            >
              에러 토스트
            </Button>
          </div>
          <CodeBlock code={basicExample} />
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Variants</h2>
          <CodeBlock code={variantsExample} />
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">With Action</h2>
          <CodeBlock code={withActionExample} />
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Setup</h2>
          <p className="text-muted-foreground mb-4">
            앱 루트에 Toaster 컴포넌트를 추가해야 합니다.
          </p>
          <CodeBlock code={`// app/layout.tsx
import { Toaster } from '@ax/ui'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  )
}`} />
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Props</h2>
          <PropsTable props={toastProps} />
        </section>
      </div>
    </div>
  )
}
