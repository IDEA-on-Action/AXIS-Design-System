import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Button,
} from '@ax/ui'
import { Terminal, Copy } from 'lucide-react'

const commands = [
  {
    name: '/ax:triage',
    description: 'Signal 평가 및 우선순위 결정',
    usage: '/ax:triage [signal-id]',
    example: '/ax:triage SIG-001',
    output: 'Scorecard 평가 결과 및 GO/PIVOT/HOLD/NO_GO 판정',
  },
  {
    name: '/ax:brief',
    description: 'GO 판정 Signal의 1-Page Brief 생성',
    usage: '/ax:brief [signal-id]',
    example: '/ax:brief SIG-001',
    output: 'Brief JSON + Confluence 페이지 URL',
  },
  {
    name: '/ax:seminar-add',
    description: '세미나/이벤트 Activity 추가',
    usage: '/ax:seminar-add',
    example: '/ax:seminar-add',
    output: '대화형 입력을 통한 Activity 생성',
  },
  {
    name: '/ax:confluence',
    description: 'Confluence 동기화 상태 확인 및 실행',
    usage: '/ax:confluence [sync|status]',
    example: '/ax:confluence sync',
    output: 'Play DB 및 Live doc 동기화 결과',
  },
  {
    name: '/ax:wrap-up',
    description: '작업 정리, 테스트, 커밋',
    usage: '/ax:wrap-up',
    example: '/ax:wrap-up',
    output: '문서 업데이트 + Git commit',
  },
  {
    name: '/ax:health-check',
    description: '프로젝트 상태 점검',
    usage: '/ax:health-check',
    example: '/ax:health-check',
    output: '의존성/타입/린트/빌드/버전 체크 리포트',
  },
  {
    name: '/ax:kpi-digest',
    description: 'KPI 요약 리포트 생성',
    usage: '/ax:kpi-digest [period]',
    example: '/ax:kpi-digest weekly',
    output: '주간/월간 KPI 달성률 리포트',
  },
]

const agents = [
  {
    name: 'orchestrator',
    description: '워크플로 실행 및 서브에이전트 조율',
    invocation: '모든 Command 실행 시 자동',
  },
  {
    name: 'external_scout',
    description: '외부 세미나/리포트/뉴스 수집',
    invocation: 'WF-01 Seminar Pipeline',
  },
  {
    name: 'scorecard_evaluator',
    description: 'Signal 정량 평가 (100점 만점)',
    invocation: '/ax:triage 또는 WF-02/04',
  },
  {
    name: 'brief_writer',
    description: '1-Page Brief 생성 + Confluence 페이지',
    invocation: '/ax:brief 또는 Scorecard GO 시',
  },
  {
    name: 'voc_analyst',
    description: 'VoC/티켓 데이터 분석 및 테마화',
    invocation: 'WF-02 Signal Extraction',
  },
  {
    name: 'interview_miner',
    description: '인터뷰 노트에서 인사이트 추출',
    invocation: 'WF-02 Signal Extraction',
  },
  {
    name: 'confluence_sync',
    description: 'Confluence DB/Live doc 업데이트',
    invocation: '모든 워크플로 종료 시',
  },
  {
    name: 'governance',
    description: '위험 작업 차단/승인/감사 로그',
    invocation: '민감한 도구 호출 시',
  },
]

function CodeBlock({ code }: { code: string }) {
  return (
    <div className="rounded-lg border bg-muted p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Terminal className="h-3 w-3" />
          <span>Terminal</span>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          <Copy className="h-3 w-3" />
        </Button>
      </div>
      <code className="text-sm font-mono">{code}</code>
    </div>
  )
}

export default function CLIPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <Badge variant="secondary">CLI Commands</Badge>
        <h1 className="text-4xl font-bold tracking-tight">CLI 명령어 가이드</h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          Claude Code CLI를 통해 AX Discovery Portal 기능을 직접 실행합니다.
        </p>
      </div>

      {/* Available Commands */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">사용 가능한 명령어</h2>
        <div className="space-y-4">
          {commands.map((cmd) => (
            <Card key={cmd.name}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle className="font-mono text-lg">{cmd.name}</CardTitle>
                </div>
                <CardDescription>{cmd.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">
                      사용법
                    </h4>
                    <CodeBlock code={cmd.usage} />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">
                      예시
                    </h4>
                    <CodeBlock code={cmd.example} />
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">
                    출력
                  </h4>
                  <p className="text-sm text-muted-foreground">{cmd.output}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Agents */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">에이전트 목록</h2>
        <Card>
          <CardHeader>
            <CardTitle>Sub Agents</CardTitle>
            <CardDescription>
              명령어 실행 시 자동으로 호출되는 전문 에이전트들
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {agents.map((agent) => (
                <div
                  key={agent.name}
                  className="flex items-start gap-4 rounded-lg border p-4"
                >
                  <div className="flex-1">
                    <div className="font-mono text-sm font-medium">
                      {agent.name}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {agent.description}
                    </p>
                  </div>
                  <Badge variant="outline" className="shrink-0">
                    {agent.invocation}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Quick Start */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">빠른 시작</h2>
        <Card>
          <CardHeader>
            <CardTitle>첫 번째 Signal 평가하기</CardTitle>
            <CardDescription>
              CLI를 사용하여 Signal을 평가하고 Brief를 생성하는 과정
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium mb-2">1. 세미나 Activity 추가</p>
                <CodeBlock code="/ax:seminar-add" />
              </div>
              <div>
                <p className="text-sm font-medium mb-2">2. Signal 평가 (Triage)</p>
                <CodeBlock code="/ax:triage" />
              </div>
              <div>
                <p className="text-sm font-medium mb-2">3. Brief 생성 (GO 판정 시)</p>
                <CodeBlock code="/ax:brief" />
              </div>
              <div>
                <p className="text-sm font-medium mb-2">4. Confluence 동기화 확인</p>
                <CodeBlock code="/ax:confluence status" />
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
