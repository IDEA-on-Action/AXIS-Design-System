import { Box, Braces, Link2, Zap, type LucideIcon } from 'lucide-react'
import { cn } from '../../lib/utils'
import { kindLabels, type ElementKind } from '../../lib/demo-data'

const icons: Record<ElementKind, LucideIcon> = {
  entity: Box,
  relation: Link2,
  logic: Braces,
  action: Zap,
}

const sizes = {
  sm: 'size-7 rounded-[7px] [&_svg]:size-[15px]',
  md: 'size-10 rounded-[10px] [&_svg]:size-[22px]',
  lg: 'size-[52px] rounded-[13px] [&_svg]:size-7',
}

/** 요소 타일: 색은 회색 하나, 종류는 아이콘으로만 구분합니다(프로토타입 v0.24 이후 규칙) */
export function ElementTile({ kind, size = 'md' }: { kind: ElementKind; size?: keyof typeof sizes }) {
  const Icon = icons[kind]
  return (
    <span
      title={kindLabels[kind]}
      className={cn('inline-flex shrink-0 items-center justify-center bg-secondary text-secondary-foreground', sizes[size])}
    >
      <Icon aria-hidden />
      <span className="sr-only">{kindLabels[kind]}</span>
    </span>
  )
}
