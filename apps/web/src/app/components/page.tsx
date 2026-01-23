import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@axis-ds/ui-react'

const components = [
  { name: 'Button', description: '다양한 스타일과 크기의 버튼 컴포넌트', href: '/components/button' },
  { name: 'Card', description: '콘텐츠를 그룹화하는 카드 컨테이너', href: '/components/card' },
  { name: 'Input', description: '텍스트 입력 필드', href: '/components/input' },
  { name: 'Label', description: '폼 필드 레이블', href: '/components/label' },
  { name: 'Select', description: '드롭다운 선택 컴포넌트', href: '/components/select' },
  { name: 'Dialog', description: '모달 다이얼로그', href: '/components/dialog' },
  { name: 'Badge', description: '상태 표시 뱃지', href: '/components/badge' },
  { name: 'Tabs', description: '탭 네비게이션', href: '/components/tabs' },
  { name: 'Separator', description: '구분선', href: '/components/separator' },
  { name: 'Toast', description: '알림 토스트 메시지', href: '/components/toast' },
  { name: 'Avatar', description: '사용자/엔티티 아바타', href: '/components/avatar' },
  { name: 'Tooltip', description: '호버 시 추가 정보 표시', href: '/components/tooltip' },
  { name: 'Skeleton', description: '로딩 상태 플레이스홀더', href: '/components/skeleton' },
  { name: 'Alert', description: '중요 정보 알림 배너', href: '/components/alert' },
  { name: 'Progress', description: '진행 상태 표시 바', href: '/components/progress' },
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
