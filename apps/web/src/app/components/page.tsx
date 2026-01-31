import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@axis-ds/ui-react'

const components = [
  { name: 'Accordion', description: '접이식 콘텐츠 패널', href: '/components/accordion' },
  { name: 'Alert', description: '중요 정보 알림 배너', href: '/components/alert' },
  { name: 'Avatar', description: '사용자/엔티티 아바타', href: '/components/avatar' },
  { name: 'Badge', description: '상태 표시 뱃지', href: '/components/badge' },
  { name: 'Breadcrumb', description: '경로 탐색 네비게이션', href: '/components/breadcrumb' },
  { name: 'Button', description: '다양한 스타일과 크기의 버튼 컴포넌트', href: '/components/button' },
  { name: 'Card', description: '콘텐츠를 그룹화하는 카드 컨테이너', href: '/components/card' },
  { name: 'Checkbox', description: '선택/해제 체크박스 입력', href: '/components/checkbox' },
  { name: 'Collapsible', description: '접이식 콘텐츠 영역', href: '/components/collapsible' },
  { name: 'Command', description: '검색 가능한 커맨드 팔레트', href: '/components/command' },
  { name: 'Dialog', description: '모달 다이얼로그', href: '/components/dialog' },
  { name: 'DropdownMenu', description: '드롭다운 메뉴', href: '/components/dropdown-menu' },
  { name: 'Input', description: '텍스트 입력 필드', href: '/components/input' },
  { name: 'Label', description: '폼 필드 레이블', href: '/components/label' },
  { name: 'Popover', description: '팝오버 콘텐츠', href: '/components/popover' },
  { name: 'Progress', description: '진행 상태 표시 바', href: '/components/progress' },
  { name: 'RadioGroup', description: '라디오 버튼 그룹', href: '/components/radio-group' },
  { name: 'ScrollArea', description: '커스텀 스크롤 영역', href: '/components/scroll-area' },
  { name: 'Select', description: '드롭다운 선택 컴포넌트', href: '/components/select' },
  { name: 'Separator', description: '구분선', href: '/components/separator' },
  { name: 'Sheet', description: '사이드 패널 오버레이', href: '/components/sheet' },
  { name: 'Skeleton', description: '로딩 상태 플레이스홀더', href: '/components/skeleton' },
  { name: 'Slider', description: '범위 슬라이더', href: '/components/slider' },
  { name: 'Switch', description: '토글 스위치', href: '/components/switch' },
  { name: 'Table', description: '데이터 테이블', href: '/components/table' },
  { name: 'Tabs', description: '탭 네비게이션', href: '/components/tabs' },
  { name: 'Textarea', description: '여러 줄 텍스트 입력', href: '/components/textarea' },
  { name: 'Toast', description: '알림 토스트 메시지', href: '/components/toast' },
  { name: 'Toggle', description: '토글 버튼', href: '/components/toggle' },
  { name: 'Tooltip', description: '호버 시 추가 정보 표시', href: '/components/tooltip' },
]

export default function ComponentsPage() {
  return (
    <div className="container py-12">
      <div className="flex flex-col gap-4 mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Components</h1>
        <p className="text-lg text-muted-foreground">
          AXIS Design System의 기본 UI 컴포넌트입니다. shadcn/ui와 100% 호환됩니다.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {components.map((component) => (
          <Link key={component.name} href={component.href}>
            <Card className="h-full transition-colors hover:bg-muted/50">
              <CardHeader>
                <CardTitle>{component.name}</CardTitle>
                <CardDescription>{component.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
