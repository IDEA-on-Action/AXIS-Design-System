import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
} from '@ax/ui'
import {
  LayoutDashboard,
  List,
  PlusCircle,
  Search,
  BarChart3,
  Bell,
} from 'lucide-react'

const dashboardSections = [
  {
    title: 'Dashboard Overview',
    icon: LayoutDashboard,
    description: '전체 파이프라인 현황을 한눈에 확인합니다.',
    features: [
      'Activity/Signal/Brief 수집 현황 카드',
      'Scorecard 판정 분포 차트',
      '주간 목표 달성률',
      '최근 알림 및 액션 아이템',
    ],
  },
  {
    title: 'Activity 관리',
    icon: List,
    description: '수집된 Activity 목록을 조회하고 관리합니다.',
    features: [
      '소스별/채널별 필터링',
      '날짜 범위 선택',
      '상세 정보 확인',
      'Signal 추출 트리거',
    ],
  },
  {
    title: 'Signal 관리',
    icon: Search,
    description: '추출된 Signal을 검토하고 평가합니다.',
    features: [
      '카테고리별/긴급도별 필터링',
      'Scorecard 상태 확인',
      '수동 분류 수정',
      'Brief 생성 트리거',
    ],
  },
  {
    title: 'Brief 관리',
    icon: BarChart3,
    description: '생성된 Brief를 관리하고 Confluence로 게시합니다.',
    features: [
      'Brief 목록 및 상세 조회',
      'Confluence 동기화 상태',
      'S2 진입 추적',
      'Brief 수정 및 재생성',
    ],
  },
]

const components = [
  {
    name: 'ActivityPreviewCard',
    description: 'Activity 미리보기 카드',
    usage: 'Activity 목록에서 개별 항목 표시',
  },
  {
    name: 'CollectorHealthBar',
    description: '수집기 상태 바',
    usage: 'Dashboard에서 수집 현황 모니터링',
  },
  {
    name: 'StepIndicator',
    description: '단계 진행 표시',
    usage: '워크플로 진행 상태 시각화',
  },
  {
    name: 'ToolCallCard',
    description: '도구 호출 카드',
    usage: '에이전트 실행 결과 표시',
  },
  {
    name: 'SeminarChatPanel',
    description: '세미나 입력 패널',
    usage: '세미나 정보 대화형 입력',
  },
  {
    name: 'ApprovalDialog',
    description: '승인 다이얼로그',
    usage: 'Scorecard 결과 검토/승인',
  },
]

const quickActions = [
  {
    action: '새 Activity 추가',
    icon: PlusCircle,
    steps: ['+ 버튼 클릭', '소스 유형 선택', '정보 입력', '저장'],
  },
  {
    action: 'Signal 검토',
    icon: Search,
    steps: ['Signal 탭 이동', '항목 선택', '상세 확인', 'Scorecard 트리거'],
  },
  {
    action: 'Brief 게시',
    icon: BarChart3,
    steps: ['Brief 탭 이동', '항목 선택', 'Confluence 연동', '게시 확인'],
  },
]

export default function WebUIPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <Badge variant="secondary">Web UI Guide</Badge>
        <h1 className="text-4xl font-bold tracking-tight">웹 UI 사용법</h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          AX Discovery Portal 웹 인터페이스의 주요 기능과 사용법을 안내합니다.
        </p>
      </div>

      {/* Dashboard Sections */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">대시보드 구성</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {dashboardSections.map((section) => {
            const Icon = section.icon
            return (
              <Card key={section.title}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{section.title}</CardTitle>
                      <CardDescription>{section.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {section.features.map((feature, idx) => (
                      <li
                        key={idx}
                        className="text-sm text-muted-foreground flex items-start gap-2"
                      >
                        <span className="text-primary mt-0.5">•</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* Quick Actions */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">빠른 액션</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {quickActions.map((item) => {
            const Icon = item.icon
            return (
              <Card key={item.action}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Icon className="h-5 w-5 text-primary" />
                    {item.action}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-2">
                    {item.steps.map((step, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs">
                          {idx + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* Agentic Components */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">주요 컴포넌트</h2>
        <Card>
          <CardHeader>
            <CardTitle>Agentic UI 컴포넌트</CardTitle>
            <CardDescription>
              AI 에이전트 협업을 위한 특수 컴포넌트들
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {components.map((comp) => (
                <div
                  key={comp.name}
                  className="rounded-lg border p-4 space-y-2"
                >
                  <div className="font-mono text-sm font-medium">{comp.name}</div>
                  <p className="text-sm text-muted-foreground">{comp.description}</p>
                  <p className="text-xs text-muted-foreground">
                    사용: {comp.usage}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Tips */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">사용 팁</h2>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              알림 설정
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• GO 판정 시 자동 알림을 받으려면 알림 설정에서 활성화하세요.</p>
            <p>• Signal 긴급도가 high인 항목은 우선 알림됩니다.</p>
            <p>• 주간 요약 리포트는 매주 월요일 오전에 발송됩니다.</p>
            <p>• Confluence 동기화 실패 시 재시도 버튼을 사용하세요.</p>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
