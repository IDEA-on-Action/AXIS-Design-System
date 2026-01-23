import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Separator,
} from '@ax/ui'
import {
  FileText,
  Lightbulb,
  ClipboardCheck,
  FileOutput,
  ArrowDown,
} from 'lucide-react'

const concepts = [
  {
    id: 'activity',
    title: 'Activity',
    icon: FileText,
    badge: '수집 단위',
    description: '외부에서 수집한 정보의 최소 단위입니다.',
    details: [
      '세미나, 컨퍼런스, 웨비나 등 이벤트 정보',
      '산업 리포트, 분석 보고서, 뉴스 기사',
      'KT/그룹사/대외 3원천에서 수집',
      '자동 수집 (external_scout) 또는 수동 입력',
    ],
    example: {
      title: 'Activity 예시',
      content: {
        type: 'seminar',
        title: 'AWS re:Invent 2024 - AI/ML 세션',
        source: '대외',
        channel: '데스크리서치',
        date: '2024-12-01',
      },
    },
  },
  {
    id: 'signal',
    title: 'Signal',
    icon: Lightbulb,
    badge: '기회 포착',
    description: 'Activity에서 추출한 사업 기회의 단서입니다.',
    details: [
      'Activity 분석을 통해 자동 추출',
      '고객 Pain Point, 시장 트렌드, 경쟁 동향 등 포함',
      '중복 제거 및 유사 Signal 병합',
      'interview_miner가 인터뷰에서 추가 추출',
    ],
    example: {
      title: 'Signal 예시',
      content: {
        title: '엔터프라이즈 AI 도입 가속화',
        type: '시장트렌드',
        relevance: 'KT Cloud AI 플랫폼 확대 기회',
        urgency: 'high',
      },
    },
  },
  {
    id: 'scorecard',
    title: 'Scorecard',
    icon: ClipboardCheck,
    badge: '정량 평가',
    description: 'Signal의 사업 가치를 5가지 차원에서 평가합니다.',
    details: [
      'Market Size (시장 규모): 0-20점',
      'Fit (KT 적합성): 0-20점',
      'Timing (시의성): 0-20점',
      'Competition (경쟁 강도): 0-20점',
      'Feasibility (실현 가능성): 0-20점',
    ],
    example: {
      title: 'Scorecard 결과',
      content: {
        total: 78,
        verdict: 'GO',
        scores: {
          market: 18,
          fit: 16,
          timing: 15,
          competition: 14,
          feasibility: 15,
        },
      },
    },
  },
  {
    id: 'brief',
    title: 'Brief',
    icon: FileOutput,
    badge: '의사결정 문서',
    description: 'GO 판정된 Signal에 대한 1-Page 요약 문서입니다.',
    details: [
      '경영진/의사결정자를 위한 핵심 요약',
      '문제 정의, 제안 솔루션, 기대 효과 포함',
      'Confluence 페이지로 자동 게시',
      'S2 (Validation) 단계 진입 근거',
    ],
    example: {
      title: 'Brief 구성',
      content: {
        sections: [
          'Executive Summary',
          'Problem Statement',
          'Proposed Solution',
          'Expected Impact',
          'Next Steps',
        ],
      },
    },
  },
]

const verdictTypes = [
  { verdict: 'GO', score: '75-100', description: 'Brief 생성 및 S2 진입', color: 'bg-green-500' },
  { verdict: 'PIVOT', score: '50-74', description: '방향 수정 후 재평가', color: 'bg-yellow-500' },
  { verdict: 'HOLD', score: '25-49', description: '모니터링 지속', color: 'bg-blue-500' },
  { verdict: 'NO_GO', score: '0-24', description: '추진 중단', color: 'bg-red-500' },
]

export default function ConceptsPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <Badge variant="secondary">Core Concepts</Badge>
        <h1 className="text-4xl font-bold tracking-tight">핵심 개념</h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          AX Discovery Portal의 핵심 데이터 모델과 그 관계를 이해합니다.
        </p>
      </div>

      {/* Pipeline Overview */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">파이프라인 개요</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="flex items-center gap-2 rounded-lg border bg-muted px-4 py-2">
                <FileText className="h-5 w-5" />
                <span className="font-medium">Activity</span>
              </div>
              <ArrowDown className="h-5 w-5 text-muted-foreground" />
              <div className="flex items-center gap-2 rounded-lg border bg-muted px-4 py-2">
                <Lightbulb className="h-5 w-5" />
                <span className="font-medium">Signal</span>
              </div>
              <ArrowDown className="h-5 w-5 text-muted-foreground" />
              <div className="flex items-center gap-2 rounded-lg border bg-muted px-4 py-2">
                <ClipboardCheck className="h-5 w-5" />
                <span className="font-medium">Scorecard</span>
              </div>
              <ArrowDown className="h-5 w-5 text-muted-foreground" />
              <div className="flex items-center gap-2 rounded-lg border bg-muted px-4 py-2">
                <FileOutput className="h-5 w-5" />
                <span className="font-medium">Brief</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Detailed Concepts */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">상세 개념</h2>
        {concepts.map((concept) => {
          const Icon = concept.icon
          return (
            <Card key={concept.id} id={concept.id}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle>{concept.title}</CardTitle>
                      <Badge variant="outline">{concept.badge}</Badge>
                    </div>
                    <CardDescription>{concept.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">주요 특징</h4>
                  <ul className="space-y-1">
                    {concept.details.map((detail, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
                <Separator />
                <div>
                  <h4 className="font-medium mb-2">{concept.example.title}</h4>
                  <div className="rounded-lg bg-muted p-4">
                    <pre className="text-xs overflow-x-auto">
                      {JSON.stringify(concept.example.content, null, 2)}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </section>

      {/* Verdict Types */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Scorecard 판정 기준</h2>
        <Card>
          <CardHeader>
            <CardTitle>Verdict Types</CardTitle>
            <CardDescription>
              Scorecard 점수에 따른 4가지 판정 유형
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {verdictTypes.map((item) => (
                <div
                  key={item.verdict}
                  className="flex items-center gap-3 rounded-lg border p-4"
                >
                  <div className={`h-3 w-3 rounded-full ${item.color}`} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{item.verdict}</span>
                      <Badge variant="secondary">{item.score}점</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
