'use client'

import { MessageBubble, PlanCard, RunProgress, StepTimeline } from '@axis-ds/agentic-ui'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from '@axis-ds/ui-react'
import { AlertCircle, AlertTriangle, CheckCircle2, Circle, Info, Loader2 } from 'lucide-react'
import { TokenReadout } from './token-readout'

/*
 * 브랜드 전환 데모 화면 (WI-0025 FR-10 · AC7 · Q8 · Q9).
 *
 * 모든 컴포넌트는 실제 패키지(@axis-ds/ui-react · @axis-ds/agentic-ui)에서 import 해요.
 * 하이드레이션 불일치를 막으려고 timestamp · new Date() · Math.random() 은 쓰지 않아요
 * (MessageBubble · StepTimeline 은 timestamp 를 받으면 시각대에 따라 다른 문자열을 렌더해요).
 * 핸들러는 데모용 no-op 이에요.
 */

const noop = () => {}

const BADGE_VARIANTS = [
  { variant: 'default', label: '기본' },
  { variant: 'secondary', label: '보조' },
  { variant: 'success', label: '성공' },
  { variant: 'warning', label: '경고' },
  { variant: 'error', label: '오류' },
  { variant: 'destructive', label: '위험' },
  { variant: 'info', label: '정보' },
  { variant: 'outline', label: '외곽선' },
] as const

const BUTTON_VARIANTS = [
  { variant: 'default', label: '기본' },
  { variant: 'secondary', label: '보조' },
  { variant: 'outline', label: '외곽선' },
  { variant: 'destructive', label: '삭제' },
  { variant: 'ghost', label: '고스트' },
  { variant: 'link', label: '링크' },
] as const

/** 「한눈에 보는 차이」: Card 하나에 Badge · Button · Input 을 모으고, 옆에 계산 스타일 표를 둬요(Q9) */
export function BrandOverview() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card data-testid="demo-card">
        <CardHeader>
          <CardTitle id="demo-card-title">배포 요청</CardTitle>
          <CardDescription>브랜드를 바꾸면 이 카드의 둥글기 · 그림자 · 색이 함께 바뀌어요.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {BADGE_VARIANTS.slice(0, 7).map(({ variant, label }) => (
              <Badge key={variant} variant={variant}>
                {label}
              </Badge>
            ))}
          </div>
          <div className="space-y-2">
            <Label htmlFor="demo-overview-input">서비스 이름</Label>
            <Input id="demo-overview-input" data-testid="demo-input" defaultValue="axis-docs" />
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2">
          <Button data-testid="demo-button-default">배포</Button>
          <Button variant="secondary">미리보기</Button>
          <Button variant="outline">취소</Button>
        </CardFooter>
      </Card>
      <TokenReadout />
    </div>
  )
}

/** 「Core UI」: AC7 의 Button · Input · Badge · Alert (Card 는 위 「한눈에 보는 차이」) */
export function CoreUiDemo() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h3 id="demo-core-button" className="text-lg font-semibold">Button</h3>
        <div className="flex flex-wrap items-center gap-2">
          {BUTTON_VARIANTS.map(({ variant, label }) => (
            <Button key={variant} variant={variant} data-testid={`demo-button-${variant}-variant`}>
              {label}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm">작게</Button>
          <Button size="lg">크게</Button>
          <Button disabled>비활성</Button>
        </div>
      </div>

      <div className="space-y-3">
        <h3 id="demo-core-input" className="text-lg font-semibold">Input</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="demo-input-placeholder">검색어</Label>
            <Input id="demo-input-placeholder" placeholder="컴포넌트 이름" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="demo-input-error">이메일</Label>
            <Input
              id="demo-input-error"
              error
              aria-invalid="true"
              aria-describedby="demo-input-error-help"
              defaultValue="axis@"
            />
            <p id="demo-input-error-help" className="text-sm text-[var(--axis-text-error)]">
              오류: 이메일 형식이 아니에요.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 id="demo-core-badge" className="text-lg font-semibold">Badge</h3>
        <div className="flex flex-wrap gap-2">
          {BADGE_VARIANTS.map(({ variant, label }) => (
            <Badge key={variant} variant={variant} data-testid={`demo-badge-${variant}`}>
              {label}
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h3 id="demo-core-alert" className="text-lg font-semibold">Alert</h3>
        <div className="space-y-3">
          <Alert variant="info" data-testid="demo-alert-info">
            <Info className="h-4 w-4" aria-hidden="true" />
            <AlertTitle>정보</AlertTitle>
            <AlertDescription>새 버전 문서가 준비됐어요.</AlertDescription>
          </Alert>
          <Alert variant="success" data-testid="demo-alert-success">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            <AlertTitle>성공</AlertTitle>
            <AlertDescription>배포를 마쳤어요.</AlertDescription>
          </Alert>
          <Alert variant="warning" data-testid="demo-alert-warning">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            <AlertTitle>경고</AlertTitle>
            <AlertDescription>토큰 사용량이 한도의 80% 를 넘었어요.</AlertDescription>
          </Alert>
          <Alert variant="destructive" data-testid="demo-alert-destructive">
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            <AlertTitle>오류</AlertTitle>
            <AlertDescription>빌드에 실패했어요.</AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  )
}

/** 「Agentic UI」: AC7 의 PlanCard · MessageBubble 과 상태 아이콘을 그리는 StepTimeline · RunProgress */
export function AgenticUiDemo() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h3 id="demo-agentic-plan-card" className="text-lg font-semibold">PlanCard</h3>
        <p className="text-sm text-muted-foreground">
          단계 상태는 컴포넌트가 아이콘과 화면에 보이지 않는 글자로만 내요. 데모에서는 단계 설명에 상태 글자를 넣어
          색과 아이콘 없이도 읽히게 했어요.
        </p>
        <div className="grid gap-4 lg:grid-cols-2">
          <div data-testid="demo-plan-card">
            <PlanCard
              title="문서 사이트 배포 계획"
              status="pending"
              onApprove={noop}
              onEdit={noop}
              onReject={noop}
              steps={[
                { id: 'p1', label: '토큰 빌드', status: 'complete', description: '완료' },
                { id: 'p2', label: '컴포넌트 빌드', status: 'running', description: '실행 중' },
                { id: 'p3', label: '타입 검사', status: 'error', description: '오류' },
                { id: 'p4', label: '시각 회귀', status: 'skipped', description: '건너뜀' },
                { id: 'p5', label: '배포', status: 'pending', description: '대기 중' },
              ]}
            />
          </div>
          <div data-testid="demo-plan-card-completed">
            <PlanCard
              title="토큰 정합 점검"
              status="completed"
              steps={[
                { id: 'c1', label: '변수 수집', status: 'complete', description: '완료' },
                { id: 'c2', label: '대비 계산', status: 'complete', description: '완료' },
              ]}
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 id="demo-agentic-message-bubble" className="text-lg font-semibold">MessageBubble</h3>
        <div className="space-y-4" data-testid="demo-message-bubble">
          <MessageBubble role="user" content="ontology 브랜드에서 버튼 색이 어떻게 바뀌나요?" />
          <MessageBubble
            role="assistant"
            content="기본 브랜드의 파란 버튼(#3B82F6)이 ontology 에서는 조금 더 짙은 파랑으로 바뀌어요."
            metadata="토큰 128개"
          />
          <MessageBubble role="system" content="브랜드 전환은 이 페이지에서만 적용돼요." />
        </div>
      </div>

      <div className="space-y-3">
        <h3 id="demo-agentic-step-timeline" className="text-lg font-semibold">StepTimeline</h3>
        <div data-testid="demo-step-timeline">
          <StepTimeline
            steps={[
              { id: 't1', label: '요청 분석', status: 'complete', description: '완료' },
              { id: 't2', label: '자료 검색', status: 'running', description: '실행 중' },
              { id: 't3', label: '도구 호출', status: 'error', description: '오류' },
              { id: 't4', label: '캐시 확인', status: 'skipped', description: '건너뜀' },
              { id: 't5', label: '답변 작성', status: 'pending', description: '대기 중' },
            ]}
          />
        </div>
      </div>

      <div className="space-y-3">
        <h3 id="demo-agentic-run-progress" className="text-lg font-semibold">RunProgress</h3>
        <div className="grid gap-4 lg:grid-cols-2">
          <div data-testid="demo-run-progress">
            <RunProgress
              status="running"
              currentStep={1}
              steps={[
                { id: 'r1', label: '데이터 읽기', status: 'complete', description: '완료' },
                { id: 'r2', label: '변환', status: 'running', description: '실행 중' },
                { id: 'r3', label: '검증', status: 'error', description: '오류' },
                { id: 'r4', label: '저장', status: 'pending', description: '대기 중' },
              ]}
            />
          </div>
          <div data-testid="demo-run-progress-error">
            <RunProgress
              status="error"
              onRetry={noop}
              steps={[
                { id: 'e1', label: '데이터 읽기', status: 'complete', description: '완료' },
                { id: 'e2', label: '변환', status: 'error', description: '오류' },
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

const STATUS_ROWS = [
  { label: '성공', variant: 'success', icon: CheckCircle2, text: '작업을 마쳤어요.' },
  { label: '경고', variant: 'warning', icon: AlertTriangle, text: '확인이 필요해요.' },
  { label: '오류', variant: 'error', icon: AlertCircle, text: '작업이 실패했어요.' },
  { label: '실행 중', variant: 'info', icon: Loader2, text: '작업이 진행되고 있어요.' },
  { label: '대기 중', variant: 'secondary', icon: Circle, text: '아직 시작하지 않았어요.' },
] as const

/** 「상태 표시」: 상태를 색만으로 구분하지 않도록 글자와 아이콘을 늘 함께 둬요(Q8) */
export function StatusLegend() {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        ontology 브랜드는 성공이 회색, 경고가 연한 빨강 쪽으로 접혀서 색만으로는 상태가 구분되지 않아요. 그래서 상태는 늘
        글자와 아이콘을 함께 보여 줘요.
      </p>
      <table className="w-full text-sm" data-testid="demo-status-legend">
        <thead>
          <tr className="border-b">
            <th scope="col" className="py-2 pr-4 text-left font-medium">상태</th>
            <th scope="col" className="py-2 pr-4 text-left font-medium">아이콘</th>
            <th scope="col" className="py-2 text-left font-medium">설명</th>
          </tr>
        </thead>
        <tbody>
          {STATUS_ROWS.map(({ label, variant, icon: Icon, text }) => (
            <tr key={label} className="border-b last:border-0">
              <td className="py-2 pr-4">
                <Badge variant={variant}>{label}</Badge>
              </td>
              <td className="py-2 pr-4">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </td>
              <td className="py-2">{text}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
