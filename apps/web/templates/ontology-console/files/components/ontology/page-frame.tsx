import { Card } from '@axis-ds/ui-react/card'
import { cn } from '../../lib/utils'

interface PageFrameProps {
  children: React.ReactNode
  /** 오른쪽 보조 상자(통합 뷰의 「확인 필요」 등). 있으면 본문 카드가 그만큼 줄어듭니다 */
  aside?: React.ReactNode
  /** 본문 카드 안 여백을 없앱니다(2분할처럼 카드 안을 직접 나누는 화면) */
  fill?: boolean
}

/**
 * 콘텐츠 카드 한 장(+ 선택적 보조 상자 420px).
 * 카드는 AXIS Card 를 그대로 씁니다. ontology 브랜드에서 둥글기 12px(--axis-radius-surface) · 그림자 없음(--axis-card-shadow)이라
 * 템플릿이 따로 그림자나 둥글기를 정하지 않습니다. 1199px 이하에서는 보조 상자가 카드 아래로 내려가 1열이 됩니다.
 */
export function PageFrame({ children, aside, fill }: PageFrameProps) {
  return (
    <div className="flex min-h-0 flex-1 gap-2.5 max-[1199px]:flex-col max-[1199px]:overflow-y-auto">
      <Card
        data-ontology-card=""
        className={cn(
          'flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto max-[1199px]:flex-none max-[1199px]:overflow-visible',
          !fill && 'px-[26px] pb-[30px] pt-6 max-[1199px]:px-5 max-[1199px]:pb-[26px] max-[1199px]:pt-5'
        )}
      >
        {children}
      </Card>
      {aside}
    </div>
  )
}

/** 보조 상자: 머리 52px + 스크롤되는 본문. 폭 420px, 1199px 이하에서는 카드 아래 전체 폭 */
export function AsideBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card
      data-ontology-aside=""
      className="flex min-h-0 w-[420px] shrink-0 flex-col overflow-hidden max-[1199px]:w-full max-[1199px]:flex-none"
    >
      <h2 className="flex h-[52px] shrink-0 items-center border-b px-3.5 text-[15px] font-bold">{title}</h2>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-4 pt-3.5">{children}</div>
    </Card>
  )
}
