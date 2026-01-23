import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Button,
} from '@ax/ui'
import {
  Rocket,
  BookOpen,
  GitBranch,
  ArrowRight,
  CheckCircle2,
  Play,
} from 'lucide-react'

const quickStartSteps = [
  {
    step: 1,
    title: '핵심 개념 이해하기',
    description: 'Activity, Signal, Scorecard, Brief의 관계를 이해합니다.',
    link: '/onboarding/concepts',
  },
  {
    step: 2,
    title: '워크플로 파악하기',
    description: '정보 수집부터 Brief 생성까지의 전체 파이프라인을 확인합니다.',
    link: '/onboarding/workflows',
  },
  {
    step: 3,
    title: '직접 사용해보기',
    description: 'Web UI 또는 CLI를 통해 첫 번째 Signal을 등록해봅니다.',
    link: '/onboarding/web-ui',
  },
]

const mainFeatures = [
  {
    title: 'Activity 수집',
    description: '세미나, 리포트, 뉴스 등 다양한 정보 소스에서 Activity를 자동 수집합니다.',
    badge: 'WF-01',
  },
  {
    title: 'Signal 추출',
    description: '수집된 Activity에서 사업 기회 Signal을 추출하고 분류합니다.',
    badge: 'WF-02',
  },
  {
    title: 'Scorecard 평가',
    description: '5가지 차원에서 Signal을 정량 평가하여 우선순위를 결정합니다.',
    badge: 'WF-03',
  },
  {
    title: 'Brief 생성',
    description: 'GO 판정 Signal에 대해 1-Page Brief를 자동 생성합니다.',
    badge: 'WF-04',
  },
]

export default function OnboardingPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">BD팀 온보딩</Badge>
        </div>
        <h1 className="text-4xl font-bold tracking-tight">Quick Start</h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          AX Discovery Portal에 오신 것을 환영합니다.
          이 가이드를 따라 빠르게 시스템을 이해하고 활용할 수 있습니다.
        </p>
      </div>

      {/* Quick Start Steps */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">3단계로 시작하기</h2>
        <div className="grid gap-4">
          {quickStartSteps.map((item) => (
            <Link key={item.step} href={item.link}>
              <Card className="transition-colors hover:bg-muted/50">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                    {item.step}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Main Features */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">주요 기능</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {mainFeatures.map((feature) => (
            <Card key={feature.title}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                  <Badge variant="outline">{feature.badge}</Badge>
                </div>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* Demo Scenario */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">데모 시나리오</h2>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              첫 번째 Brief 만들어보기
            </CardTitle>
            <CardDescription>
              실제 시나리오를 따라 Activity 수집부터 Brief 생성까지 전체 과정을 체험합니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>AI/클라우드 세미나 정보 입력</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>자동 Signal 추출 및 분류</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Scorecard 평가 (100점 만점)</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>GO/PIVOT/HOLD/NO_GO 판정</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>1-Page Brief 자동 생성</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/onboarding/workflows">
                <Button>
                  <GitBranch className="mr-2 h-4 w-4" />
                  워크플로 확인하기
                </Button>
              </Link>
              <Link href="/onboarding/cli">
                <Button variant="outline">
                  CLI로 시작하기
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Quick Links */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">바로가기</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Link href="/onboarding/concepts">
            <Card className="h-full transition-colors hover:bg-muted/50">
              <CardHeader>
                <BookOpen className="h-8 w-8 mb-2 text-primary" />
                <CardTitle className="text-lg">핵심 개념</CardTitle>
                <CardDescription>
                  Activity, Signal, Scorecard, Brief
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
          <Link href="/onboarding/web-ui">
            <Card className="h-full transition-colors hover:bg-muted/50">
              <CardHeader>
                <Rocket className="h-8 w-8 mb-2 text-primary" />
                <CardTitle className="text-lg">Web UI 가이드</CardTitle>
                <CardDescription>
                  대시보드 사용법
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
          <Link href="/onboarding/faq">
            <Card className="h-full transition-colors hover:bg-muted/50">
              <CardHeader>
                <GitBranch className="h-8 w-8 mb-2 text-primary" />
                <CardTitle className="text-lg">FAQ</CardTitle>
                <CardDescription>
                  자주 묻는 질문
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </section>
    </div>
  )
}
