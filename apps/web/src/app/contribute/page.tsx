'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Badge } from '@axis-ds/ui-react'
import { GitPullRequest, FileJson, Shield, CheckCircle2, ExternalLink, BookOpen } from 'lucide-react'

const steps = [
  {
    icon: FileJson,
    title: '1. JSON 파일 생성',
    description: 'apps/web/data/ 디렉토리에 새 JSON 파일을 생성합니다.',
    detail: '각 항목에 name, slug, description, externalUrl, source 필드를 포함합니다.',
  },
  {
    icon: Shield,
    title: '2. 라이선스 확인',
    description: '외부 DS의 라이선스가 MIT와 호환되는지 확인합니다.',
    detail: 'pnpm check-licenses 명령으로 자동 검증할 수 있습니다.',
  },
  {
    icon: CheckCircle2,
    title: '3. 빌드 & 검증',
    description: '빌드 스크립트가 data/ 폴더를 자동 탐색하여 인덱스에 병합합니다.',
    detail: 'pnpm build:registry 실행 후 갤러리에서 확인하세요.',
  },
  {
    icon: GitPullRequest,
    title: '4. PR 제출',
    description: 'PR 템플릿의 체크리스트를 완료하고 리뷰를 요청합니다.',
    detail: '타입 체크, 린트, 빌드, 라이선스 검증을 모두 통과해야 합니다.',
  },
]

const compatibleLicenses = ['MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'ISC', 'CC0-1.0']
const incompatibleLicenses = ['GPL-2.0', 'GPL-3.0', 'AGPL-3.0', 'SSPL-1.0']

export default function ContributePage() {
  return (
    <div className="container py-12 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-12">
        <h1 className="text-4xl font-bold tracking-tight">Contribute</h1>
        <p className="text-lg text-muted-foreground">
          외부 디자인 시스템을 AXIS 연합 갤러리에 추가하는 방법을 안내합니다.
        </p>
      </div>

      {/* Steps */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6">외부 DS 추가 절차</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {steps.map((step) => {
            const Icon = step.icon
            return (
              <Card key={step.title}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-base">{step.title}</CardTitle>
                  </div>
                  <CardDescription>{step.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground">{step.detail}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* JSON Schema */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">데이터 스키마</h2>
        <Card>
          <CardContent className="pt-6">
            <pre className="text-sm bg-muted p-4 rounded-lg overflow-x-auto">
{`{
  "name": "리소스 이름",
  "slug": "소스-리소스id",
  "description": "리소스 설명",
  "category": "minimal | landing-page | dashboard | app | agentic",
  "type": "external",
  "externalUrl": "https://...",
  "source": "소스명",
  "tags": ["tag1", "tag2"],
  "features": ["Feature 1", "Feature 2"]
}`}
            </pre>
          </CardContent>
        </Card>
      </section>

      {/* License Compatibility */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">라이선스 호환성</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-green-600 dark:text-green-400">호환 라이선스</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-2">
                {compatibleLicenses.map((license) => (
                  <Badge key={license} variant="secondary">{license}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-red-600 dark:text-red-400">비호환 라이선스</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-2">
                {incompatibleLicenses.map((license) => (
                  <Badge key={license} variant="outline">{license}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Links */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">참고 링크</h2>
        <div className="flex flex-col gap-3">
          <a
            href="https://github.com/IDEA-on-Action/AXIS-Design-System/blob/main/CONTRIBUTING.md"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <BookOpen className="h-4 w-4" />
            CONTRIBUTING.md (전체 기여 가이드)
            <ExternalLink className="h-3 w-3" />
          </a>
          <Link
            href="/templates"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            Templates 갤러리 보기
          </Link>
        </div>
      </section>
    </div>
  )
}
