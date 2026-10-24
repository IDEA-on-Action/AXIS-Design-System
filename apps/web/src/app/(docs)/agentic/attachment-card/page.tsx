'use client'

import { useState } from 'react'
import { Button } from '@axis-ds/ui-react'
import { AttachmentCard, type AttachmentType, type AttachmentStatus } from '@axis-ds/agentic-ui'
import { CodeBlock } from '@/components/code-block'
import { DocPageLayout } from '@/components/doc-page-layout'
import { DocSection } from '@/components/doc-section'
import { KeyboardTable } from '@/components/keyboard-table'
import { PropsTable } from '@/components/props-table'

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
        <CodeBlock code="npx @axis-ds/cli add attachment-card --agentic" language="bash" />
      </DocSection>

      <DocSection title="Usage">
        <CodeBlock code={basicExample} />
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

      <DocSection title="Props">
        <PropsTable props={attachmentCardProps} />
      </DocSection>

      <DocSection title="Accessibility">
        <p className="mb-4 text-muted-foreground">
          {
            '카드는 role="article"로 마크업되고, 업로드 진행은 role="progressbar" + aria-valuenow / aria-valuemin / aria-valuemax로 전달됩니다.'
          }
        </p>
        <KeyboardTable
          keys={[
            { key: 'Tab', description: '카드 내 액션(삭제 등)으로 이동합니다.' },
            { key: 'Enter / Space', description: '포커스된 액션을 실행합니다.' },
          ]}
        />
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li key={0}>{'파일명이 접근 가능한 이름으로 노출됩니다.'}</li>
          <li key={1}>{'액션 버튼에 aria-label이 제공됩니다.'}</li>
        </ul>
      </DocSection>
    </DocPageLayout>
  )
}
