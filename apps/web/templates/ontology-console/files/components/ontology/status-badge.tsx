import { Badge, type BadgeProps } from '@axis-ds/ui-react/badge'
import { statusLabels, type ElementStatus } from '../../lib/demo-data'

/**
 * 상태 뱃지. 세 계열만 씁니다: 무채색(작성 중 · 배포됨) · 파랑(확인 필요, 봐야 할 것) · 빨강(주의).
 * 색은 AXIS Badge 변형이 브랜드 토큰에서 가져옵니다.
 */
const variants: Record<ElementStatus, NonNullable<BadgeProps['variant']>> = {
  draft: 'secondary',
  published: 'default',
  review: 'info',
  warning: 'warning',
}

export function StatusBadge({ status }: { status: ElementStatus }) {
  return <Badge variant={variants[status]}>{statusLabels[status]}</Badge>
}
