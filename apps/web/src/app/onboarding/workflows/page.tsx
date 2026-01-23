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
  Search,
  Filter,
  ClipboardCheck,
  FileOutput,
  RefreshCw,
  ArrowRight,
} from 'lucide-react'

const workflows = [
  {
    id: 'WF-01',
    title: 'Seminar Pipeline',
    icon: Search,
    description: '외부 세미나/리포트/뉴스에서 Activity 수집',
    trigger: '/ax:seminar-add 또는 자동 스케줄',
    agents: ['external_scout'],
    steps: [
      '외부 소스 스캔 (웹, RSS, API)',
      'Activity 메타데이터 추출',
      '중복 체크 및 필터링',
      'Confluence Play DB에 저장',
    ],
    output: 'Activity 객체 목록',
  },
  {
    id: 'WF-02',
    title: 'Signal Extraction',
    icon: Filter,
    description: 'Activity에서 사업 기회 Signal 추출',
    trigger: 'WF-01 완료 후 자동 또는 /ax:triage',
    agents: ['voc_analyst', 'interview_miner'],
    steps: [
      'Activity 컨텐츠 분석',
      'Signal 후보 추출 (Pain Point, 트렌드, 기회)',
      '유사 Signal 병합 및 중복 제거',
      'Signal 분류 (카테고리, 긴급도)',
    ],
    output: 'Signal 객체 목록',
  },
  {
    id: 'WF-03',
    title: 'Scorecard Evaluation',
    icon: ClipboardCheck,
    description: 'Signal의 사업 가치 정량 평가',
    trigger: 'WF-02 완료 후 자동 또는 /ax:scorecard',
    agents: ['scorecard_evaluator'],
    steps: [
      '5차원 평가 (Market, Fit, Timing, Competition, Feasibility)',
      '총점 계산 (100점 만점)',
      'GO/PIVOT/HOLD/NO_GO 판정',
      'Confluence Play DB 업데이트',
    ],
    output: 'Scorecard 객체 + Verdict',
  },
  {
    id: 'WF-04',
    title: 'Brief Generation',
    icon: FileOutput,
    description: 'GO 판정 Signal에 대한 Brief 자동 생성',
    trigger: 'Scorecard GO 판정 시 자동 또는 /ax:brief',
    agents: ['brief_writer', 'confluence_sync'],
    steps: [
      'Signal + Scorecard 정보 수집',
      '1-Page Brief 템플릿 생성',
      'Confluence 페이지 생성/업데이트',
      'S2 단계 진입 알림',
    ],
    output: 'Brief 문서 + Confluence 페이지',
  },
]

const pipelineOverview = [
  { id: 'WF-01', label: 'Seminar Pipeline', color: 'bg-blue-500' },
  { id: 'WF-02', label: 'Signal Extraction', color: 'bg-purple-500' },
  { id: 'WF-03', label: 'Scorecard Evaluation', color: 'bg-orange-500' },
  { id: 'WF-04', label: 'Brief Generation', color: 'bg-green-500' },
]

export default function WorkflowsPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <Badge variant="secondary">Workflows</Badge>
        <h1 className="text-4xl font-bold tracking-tight">워크플로 가이드</h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          Activity 수집부터 Brief 생성까지 전체 파이프라인의 흐름을 이해합니다.
        </p>
      </div>

      {/* Pipeline Overview */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">파이프라인 흐름</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center justify-center gap-2">
              {pipelineOverview.map((item, idx) => (
                <div key={item.id} className="flex items-center gap-2">
                  <div className="flex items-center gap-2 rounded-lg border px-4 py-2">
                    <div className={`h-3 w-3 rounded-full ${item.color}`} />
                    <span className="text-sm font-medium">{item.id}</span>
                  </div>
                  {idx < pipelineOverview.length - 1 && (
                    <ArrowRight className="h-4 w-4 text-muted-foreground hidden sm:block" />
                  )}
                </div>
              ))}
            </div>
            <p className="text-center text-sm text-muted-foreground mt-4">
              각 워크플로는 순차적으로 실행되며, 자동 트리거 또는 수동 실행이 가능합니다.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Detailed Workflows */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">워크플로 상세</h2>
        {workflows.map((wf) => {
          const Icon = wf.icon
          return (
            <Card key={wf.id}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge>{wf.id}</Badge>
                      <CardTitle>{wf.title}</CardTitle>
                    </div>
                    <CardDescription>{wf.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">
                      트리거
                    </h4>
                    <p className="text-sm">{wf.trigger}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">
                      담당 에이전트
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {wf.agents.map((agent) => (
                        <Badge key={agent} variant="outline">
                          {agent}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <Separator />
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">
                    실행 단계
                  </h4>
                  <ol className="space-y-2">
                    {wf.steps.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                          {idx + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
                <Separator />
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">
                    출력
                  </h4>
                  <p className="text-sm">{wf.output}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </section>

      {/* Continuous Loop */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">지속적 운영</h2>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Weekly Cycle
            </CardTitle>
            <CardDescription>
              PoC 기간 중 주간 목표 및 운영 사이클
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="text-center p-4 rounded-lg bg-muted">
                <div className="text-3xl font-bold text-primary">20+</div>
                <div className="text-sm text-muted-foreground">Activity/주</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted">
                <div className="text-3xl font-bold text-primary">30+</div>
                <div className="text-sm text-muted-foreground">Signal/주</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted">
                <div className="text-3xl font-bold text-primary">6+</div>
                <div className="text-sm text-muted-foreground">Brief/주</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted">
                <div className="text-3xl font-bold text-primary">2-4</div>
                <div className="text-sm text-muted-foreground">S2 진입/주</div>
              </div>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              <p>• Signal→Brief: 7일 이내</p>
              <p>• Brief→S2: 14일 이내</p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
