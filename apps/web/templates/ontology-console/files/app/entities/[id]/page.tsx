import { notFound } from 'next/navigation'
import { DetailHead } from '../../../components/ontology/detail-head'
import { ElementDetailTabs } from '../../../components/ontology/element-detail-tabs'
import { ElementTile } from '../../../components/ontology/element-tile'
import { PageFrame } from '../../../components/ontology/page-frame'
import { StatusBadge } from '../../../components/ontology/status-badge'
import { elements, findElement } from '../../../lib/demo-data'

export function generateStaticParams() {
  return elements.map((e) => ({ id: e.id }))
}

/** depth 상세: 뒤로 · 이전 · 다음, 세그먼트 탭. 목록의 줄을 누르면 이 화면으로 옵니다 */
export default async function EntityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const element = findElement(id)
  if (!element) notFound()

  const index = elements.findIndex((e) => e.id === element.id)
  const prev = elements[index - 1]
  const next = elements[index + 1]

  return (
    <PageFrame>
      <DetailHead
        backHref="/entities"
        backLabel="요소 목록으로"
        title={element.name}
        subtitle={`${element.nameEn} · ${element.owner}`}
        lead={<ElementTile kind={element.kind} />}
        badges={<StatusBadge status={element.status} />}
        prevHref={prev ? `/entities/${prev.id}` : undefined}
        nextHref={next ? `/entities/${next.id}` : undefined}
      />
      <ElementDetailTabs element={element} />
    </PageFrame>
  )
}
