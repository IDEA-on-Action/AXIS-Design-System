'use client'

import { useState } from 'react'
import { Button } from '@axis-ds/ui-react'
import { CodeBlock } from '@/components/code-block'
import { DocPageLayout } from '@/components/doc-page-layout'
import { DocSection } from '@/components/doc-section'
import { PropsTable } from '@/components/props-table'

type AttachmentType = 'image' | 'document' | 'code' | 'archive' | 'other'
type AttachmentStatus = 'uploading' | 'complete' | 'error'

const AttachmentCard = ({
  type,
  name,
  size,
  status = 'complete',
  progress,
  onRemove,
}: {
  type: AttachmentType
  name: string
  size?: number
  status?: AttachmentStatus
  progress?: number
  onRemove?: () => void
}) => {
  const typeIcons: Record<AttachmentType, string> = {
    image: '🖼️',
    document: '📄',
    code: '💻',
    archive: '📦',
    other: '📎',
  }

  const typeColors: Record<AttachmentType, string> = {
    image: 'bg-purple-50 border-purple-200',
    document: 'bg-blue-50 border-blue-200',
    code: 'bg-green-50 border-green-200',
    archive: 'bg-yellow-50 border-yellow-200',
    other: 'bg-gray-50 border-gray-200',
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className={`rounded-lg border p-3 flex items-center gap-3 ${typeColors[type]}`}>
      <div className="text-2xl flex-shrink-0">{typeIcons[type]}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{name}</p>
        <div className="flex items-center gap-2">
          {size && <span className="text-xs text-muted-foreground">{formatSize(size)}</span>}
          {status === 'uploading' && (
            <span className="text-xs text-blue-600">{progress ?? 0}%</span>
          )}
          {status === 'error' && <span className="text-xs text-red-500">업로드 실패</span>}
        </div>
        {status === 'uploading' && (
          <div className="w-full h-1 rounded-full bg-gray-200 mt-1.5 overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-500 transition-all"
              style={{ width: `${progress ?? 0}%` }}
            />
          </div>
        )}
      </div>
      {onRemove && status !== 'uploading' && (
        <button
          onClick={onRemove}
          className="text-muted-foreground hover:text-foreground text-sm flex-shrink-0"
          aria-label="삭제"
        >
          ✕
        </button>
      )}
    </div>
  )
}

const attachmentCardProps = [
  {
    name: 'type',
    type: '"image" | "document" | "code" | "archive" | "other"',
    required: true,
    description: '파일 유형',
  },
  { name: 'name', type: 'string', required: true, description: '파일 이름' },
  { name: 'size', type: 'number', default: '-', description: '파일 크기 (bytes)' },
  { name: 'url', type: 'string', default: '-', description: '파일 URL' },
  { name: 'thumbnail', type: 'string', default: '-', description: '이미지 썸네일 URL' },
  {
    name: 'status',
    type: '"uploading" | "complete" | "error"',
    default: '"complete"',
    description: '파일 상태',
  },
  { name: 'progress', type: 'number', default: '-', description: '업로드 진행률 (0-100)' },
  { name: 'onRemove', type: '() => void', default: '-', description: '삭제 콜백' },
  { name: 'className', type: 'string', default: '-', description: '추가 CSS 클래스' },
]

const basicExample = `import { AttachmentCard } from '@axis-ds/agentic-ui'

export function Example() {
  return (
    <div className="space-y-2">
      <AttachmentCard
        type="image"
        name="screenshot.png"
        size={245000}
        status="complete"
        onRemove={() => console.log('삭제')}
      />
      <AttachmentCard
        type="document"
        name="report.pdf"
        size={1250000}
        status="uploading"
        progress={65}
      />
    </div>
  )
}`

export default function AttachmentCardPage() {
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)

  const simulateUpload = () => {
    setIsUploading(true)
    setUploadProgress(0)
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(() => setIsUploading(false), 500)
          return 100
        }
        return prev + 10
      })
    }, 300)
  }

  return (
    <DocPageLayout
      category="Agentic UI"
      categoryHref="/agentic"
      title="AttachmentCard"
      description="파일 첨부를 표시하는 카드 컴포넌트입니다. 다양한 파일 타입과 업로드 상태를 지원합니다."
    >
      <DocSection title="Installation">
        <CodeBlock code="npx axis-cli add attachment-card --agentic" language="bash" />
      </DocSection>

      <DocSection title="Interactive Demo">
        <div className="mb-4 p-6 rounded-lg border space-y-4">
          <Button onClick={simulateUpload} disabled={isUploading}>
            {isUploading ? '업로드 중...' : '업로드 시뮬레이션'}
          </Button>
          {isUploading ? (
            <AttachmentCard
              type="document"
              name="analysis-report.pdf"
              size={3200000}
              status="uploading"
              progress={uploadProgress}
            />
          ) : (
            <AttachmentCard
              type="document"
              name="analysis-report.pdf"
              size={3200000}
              status={uploadProgress >= 100 ? 'complete' : 'complete'}
              onRemove={() => setUploadProgress(0)}
            />
          )}
        </div>
      </DocSection>

      <DocSection title="File Types">
        <div className="mb-4 p-6 rounded-lg border space-y-3">
          <AttachmentCard type="image" name="photo.png" size={245000} onRemove={() => {}} />
          <AttachmentCard type="document" name="report.pdf" size={1250000} onRemove={() => {}} />
          <AttachmentCard type="code" name="index.tsx" size={4200} onRemove={() => {}} />
          <AttachmentCard type="archive" name="project.zip" size={15600000} onRemove={() => {}} />
          <AttachmentCard type="other" name="data.bin" size={890000} onRemove={() => {}} />
        </div>
      </DocSection>

      <DocSection title="States">
        <div className="mb-4 p-6 rounded-lg border space-y-3">
          <div>
            <p className="text-sm font-medium mb-2">Complete</p>
            <AttachmentCard
              type="image"
              name="done.png"
              size={500000}
              status="complete"
              onRemove={() => {}}
            />
          </div>
          <div>
            <p className="text-sm font-medium mb-2">Uploading</p>
            <AttachmentCard
              type="document"
              name="uploading.pdf"
              size={2000000}
              status="uploading"
              progress={45}
            />
          </div>
          <div>
            <p className="text-sm font-medium mb-2">Error</p>
            <AttachmentCard
              type="archive"
              name="failed.zip"
              size={50000000}
              status="error"
              onRemove={() => {}}
            />
          </div>
        </div>
      </DocSection>

      <DocSection title="Usage">
        <CodeBlock code={basicExample} />
      </DocSection>

      <DocSection title="Props">
        <PropsTable props={attachmentCardProps} />
      </DocSection>
    </DocPageLayout>
  )
}
