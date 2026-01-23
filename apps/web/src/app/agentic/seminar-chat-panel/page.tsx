'use client'

import { CodeBlock } from '@/components/code-block'
import { PropsTable } from '@/components/props-table'
import Link from 'next/link'
import { Bot, User, Send, Paperclip, X } from 'lucide-react'

const seminarChatPanelProps = [
  { name: 'isOpen', type: 'boolean', default: '-', description: '패널 열림 상태', required: true },
  { name: 'onClose', type: '() => void', default: '-', description: '닫기 핸들러', required: true },
  { name: 'onSeminarAdded', type: '(seminars: SeminarExtractResult[]) => void', default: '-', description: '세미나 추가 완료 콜백' },
  { name: 'onChatSubmit', type: '(message: string, files?: File[]) => Promise<...>', default: '-', description: '채팅 제출 핸들러', required: true },
  { name: 'onConfirmSeminars', type: '(seminars: SeminarExtractResult[], playId?: string) => Promise<void>', default: '-', description: '세미나 확인 핸들러', required: true },
  { name: 'onUploadFiles', type: '(files: File[], playId?: string) => Promise<...>', default: '-', description: '파일 업로드 핸들러', required: true },
]

const seminarExtractResultProps = [
  { name: 'title', type: 'string', default: '-', description: '세미나 제목', required: true },
  { name: 'description', type: 'string | null', default: 'null', description: '세미나 설명' },
  { name: 'date', type: 'string | null', default: 'null', description: '일시' },
  { name: 'organizer', type: 'string | null', default: 'null', description: '주최자' },
  { name: 'url', type: 'string | null', default: 'null', description: 'URL' },
  { name: 'categories', type: 'string[]', default: '[]', description: '카테고리 목록' },
  { name: 'confidence', type: 'number', default: '-', description: '추출 신뢰도 (0-1)', required: true },
]

const basicExample = `import { SeminarChatPanel } from '@ax/ui'
import { useState } from 'react'

export function Example() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        세미나 추가
      </Button>

      <SeminarChatPanel
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSeminarAdded={(seminars) => {
          console.log('Added:', seminars)
        }}
        onChatSubmit={async (message, files) => {
          // API 호출
          const response = await fetch('/api/seminar/extract', {
            method: 'POST',
            body: JSON.stringify({ message, files }),
          })
          return response.body // SSE 스트림
        }}
        onConfirmSeminars={async (seminars, playId) => {
          await fetch('/api/seminar/confirm', {
            method: 'POST',
            body: JSON.stringify({ seminars, playId }),
          })
        }}
        onUploadFiles={async (files, playId) => {
          const formData = new FormData()
          files.forEach(f => formData.append('files', f))
          const response = await fetch('/api/seminar/upload', {
            method: 'POST',
            body: formData,
          })
          return response.json()
        }}
      />
    </>
  )
}`

export default function SeminarChatPanelPage() {
  return (
    <div className="container py-12">
      <div className="max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/agentic" className="hover:text-foreground">Agentic UI</Link>
            <span>/</span>
            <span>SeminarChatPanel</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">SeminarChatPanel</h1>
          <p className="text-lg text-muted-foreground">
            채팅 기반 세미나 정보 추가 패널입니다. URL, 텍스트, 파일에서
            세미나 정보를 추출하고 등록할 수 있습니다.
          </p>
        </div>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Installation</h2>
          <CodeBlock code="npx axis-cli add seminar-chat-panel" language="bash" />
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Preview</h2>
          <div className="mb-4 rounded-lg border bg-muted/30 overflow-hidden">
            {/* 미니 패널 프리뷰 */}
            <div className="bg-white shadow-lg max-w-md mx-auto">
              {/* 헤더 */}
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <h2 className="font-semibold">세미나 추가</h2>
                <button className="p-1 hover:bg-muted rounded">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* 탭 */}
              <div className="px-4 pt-2">
                <div className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground">
                  <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium bg-background text-foreground shadow">
                    채팅으로 추가
                  </button>
                  <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium">
                    파일 업로드
                  </button>
                </div>
              </div>

              {/* 메시지 */}
              <div className="p-4 space-y-4 h-48 overflow-y-auto">
                <div className="flex gap-2">
                  <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <div className="inline-block rounded-lg px-3 py-2 text-sm bg-gray-100 text-gray-800">
                      안녕하세요! 세미나 정보를 추가해드릴게요. URL을 붙여넣거나, 세미나 정보를 입력해주세요.
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 flex-row-reverse">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1 text-right">
                    <div className="inline-block rounded-lg px-3 py-2 text-sm bg-blue-500 text-white">
                      https://festa.io/events/12345
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <div className="inline-block rounded-lg px-3 py-2 text-sm bg-gray-100 text-gray-800">
                      1개의 세미나를 찾았습니다.
                    </div>
                  </div>
                </div>
              </div>

              {/* 입력창 */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium border border-input bg-background hover:bg-accent h-9 w-9">
                    <Paperclip className="h-4 w-4" />
                  </button>
                  <input
                    type="text"
                    placeholder="URL 또는 세미나 정보 입력..."
                    className="flex-1 flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  />
                  <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-3">
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Usage</h2>
          <CodeBlock code={basicExample} />
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Features</h2>
          <div className="grid gap-4">
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold mb-2">URL 자동 추출</h3>
              <p className="text-sm text-muted-foreground">
                세미나 URL을 입력하면 자동으로 제목, 일시, 주최자 등을 추출합니다.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold mb-2">파일 업로드</h3>
              <p className="text-sm text-muted-foreground">
                이미지, PDF, 문서 파일에서 OCR을 통해 세미나 정보를 추출합니다.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold mb-2">실시간 스트리밍</h3>
              <p className="text-sm text-muted-foreground">
                SSE를 통해 추출 진행 상황을 실시간으로 표시합니다.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold mb-2">선택적 등록</h3>
              <p className="text-sm text-muted-foreground">
                추출된 세미나 중 원하는 것만 선택하여 등록할 수 있습니다.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Props</h2>
          <PropsTable props={seminarChatPanelProps} />
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">SeminarExtractResult Interface</h2>
          <PropsTable props={seminarExtractResultProps} />
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">ChatSSEEvent Type</h2>
          <CodeBlock code={`interface ChatSSEEvent {
  type: 'start' | 'progress' | 'info' | 'extracted' | 'complete' | 'error'
  message?: string
  seminars?: SeminarExtractResult[]
  count?: number
  timestamp?: string
}`} />
        </section>
      </div>
    </div>
  )
}
