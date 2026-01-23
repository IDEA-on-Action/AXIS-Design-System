'use client'

import { FileUploadZone } from '@ax/ui'
import { CodeBlock } from '@/components/code-block'
import { PropsTable } from '@/components/props-table'
import Link from 'next/link'

const fileUploadZoneProps = [
  { name: 'onUpload', type: '(files: File[], playId?: string) => Promise<UploadResponse>', default: '-', description: '파일 업로드 핸들러', required: true },
  { name: 'onComplete', type: '(seminars: SeminarExtractResult[]) => void', default: '-', description: '업로드 완료 콜백' },
  { name: 'className', type: 'string', default: '-', description: '추가 CSS 클래스' },
]

const uploadResponseProps = [
  { name: 'total_extracted', type: 'number', default: '-', description: '총 추출된 세미나 수', required: true },
  { name: 'results', type: 'UploadResult[]', default: '-', description: '파일별 결과 목록', required: true },
]

const uploadResultProps = [
  { name: 'filename', type: 'string', default: '-', description: '파일명', required: true },
  { name: 'extracted_count', type: 'number', default: '-', description: '추출된 세미나 수', required: true },
  { name: 'seminars', type: 'SeminarExtractResult[]', default: '-', description: '추출된 세미나 목록', required: true },
  { name: 'error', type: 'string | null', default: 'null', description: '오류 메시지' },
]

const basicExample = `import { FileUploadZone } from '@ax/ui'

export function Example() {
  const handleUpload = async (files: File[], playId?: string) => {
    const formData = new FormData()
    files.forEach(f => formData.append('files', f))
    if (playId) formData.append('play_id', playId)

    const response = await fetch('/api/seminar/upload', {
      method: 'POST',
      body: formData,
    })
    return response.json()
  }

  return (
    <FileUploadZone
      onUpload={handleUpload}
      onComplete={(seminars) => {
        console.log('Extracted seminars:', seminars)
      }}
    />
  )
}`

const mockUpload = async () => {
  // 실제로는 API 호출
  return {
    total_extracted: 0,
    results: [],
  }
}

export default function FileUploadZonePage() {
  return (
    <div className="container py-12">
      <div className="max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/agentic" className="hover:text-foreground">Agentic UI</Link>
            <span>/</span>
            <span>FileUploadZone</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">FileUploadZone</h1>
          <p className="text-lg text-muted-foreground">
            드래그 앤 드롭 파일 업로드 컴포넌트입니다. 이미지, PDF, 문서 파일에서
            OCR을 통해 세미나 정보를 추출합니다.
          </p>
        </div>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Installation</h2>
          <CodeBlock code="npx axis-cli add file-upload-zone" language="bash" />
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Usage</h2>
          <div className="mb-4 p-6 rounded-lg border bg-muted/30">
            <FileUploadZone
              onUpload={mockUpload}
              onComplete={(seminars) => {
                console.log('Extracted:', seminars)
              }}
            />
          </div>
          <CodeBlock code={basicExample} />
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Supported File Types</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold mb-2">이미지</h3>
              <p className="text-sm text-muted-foreground">
                JPG, JPEG, PNG, WebP, GIF
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                OCR로 텍스트 추출
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold mb-2">문서</h3>
              <p className="text-sm text-muted-foreground">
                PDF, DOCX
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                텍스트 및 이미지 추출
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold mb-2">스프레드시트</h3>
              <p className="text-sm text-muted-foreground">
                XLSX, XLS, CSV
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                행별 세미나 정보 파싱
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold mb-2">텍스트</h3>
              <p className="text-sm text-muted-foreground">
                TXT, JSON, MD
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                직접 텍스트 파싱
              </p>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">File Status</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="h-8 w-8 bg-gray-200 rounded flex items-center justify-center">
                <span className="text-xs">PDF</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">seminar-list.pdf</p>
                <p className="text-xs text-gray-500">2.4 MB</p>
              </div>
              <span className="text-xs text-gray-400">Pending</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="h-8 w-8 bg-gray-200 rounded flex items-center justify-center">
                <span className="text-xs">IMG</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">screenshot.png</p>
                <p className="text-xs text-gray-500">1.2 MB</p>
                <p className="text-xs text-green-600">3개 세미나 추출</p>
              </div>
              <span className="text-green-500">✓</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="h-8 w-8 bg-gray-200 rounded flex items-center justify-center">
                <span className="text-xs">XLS</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">data.xlsx</p>
                <p className="text-xs text-gray-500">512 KB</p>
                <p className="text-xs text-red-600">파싱 실패: 잘못된 형식</p>
              </div>
              <span className="text-red-500">✕</span>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Props</h2>
          <PropsTable props={fileUploadZoneProps} />
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">UploadResponse Interface</h2>
          <PropsTable props={uploadResponseProps} />
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">UploadResult Interface</h2>
          <PropsTable props={uploadResultProps} />
        </section>
      </div>
    </div>
  )
}
