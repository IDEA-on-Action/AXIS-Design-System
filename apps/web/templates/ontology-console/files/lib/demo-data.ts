/**
 * 가상 예시 데이터. 실제 회사 · 고객 · 개인 이름은 넣지 않습니다.
 * 실제 앱에서는 이 파일을 API 호출로 바꿉니다.
 */

export type ElementKind = 'entity' | 'relation' | 'logic' | 'action'

/** 상태는 세 계열(무채색 · 파랑 · 빨강)로만 표시합니다 */
export type ElementStatus = 'draft' | 'review' | 'published' | 'warning'

export interface ElementProperty {
  name: string
  type: string
  required: boolean
  description: string
}

export interface OntologyElement {
  id: string
  name: string
  nameEn: string
  kind: ElementKind
  status: ElementStatus
  owner: string
  updatedAt: string
  projectId: string
  description: string
  properties: ElementProperty[]
  relatedIds: string[]
  history: { at: string; summary: string }[]
}

export interface Project {
  id: string
  name: string
  summary: string
  owner: string
  status: ElementStatus
  elementIds: string[]
}

export const workspace = { name: '예시 워크스페이스', role: '온톨로지 설계' }

export const kindLabels: Record<ElementKind, string> = {
  entity: '엔티티',
  relation: '관계',
  logic: '로직',
  action: '액션',
}

export const statusLabels: Record<ElementStatus, string> = {
  draft: '작성 중',
  review: '확인 필요',
  published: '배포됨',
  warning: '주의',
}

export const elements: OntologyElement[] = [
  {
    id: 'e-order',
    name: '주문',
    nameEn: 'Order',
    kind: 'entity',
    status: 'published',
    owner: '주문 도메인 팀',
    updatedAt: '2026-10-24',
    projectId: 'p-commerce',
    description: '고객이 상품을 사기로 한 한 건의 요청이에요. 결제와 배송의 기준이 돼요.',
    properties: [
      { name: 'orderId', type: 'string', required: true, description: '주문 번호' },
      { name: 'orderedAt', type: 'datetime', required: true, description: '주문 시각' },
      { name: 'totalAmount', type: 'decimal', required: true, description: '결제 금액 합계' },
      { name: 'channel', type: 'enum', required: false, description: '주문 경로(웹 · 앱 · 매장)' },
    ],
    relatedIds: ['e-customer', 'e-product', 'r-places', 'a-cancel'],
    history: [
      { at: '2026-10-24', summary: '결제 금액 합계 속성을 필수로 바꿨어요' },
      { at: '2026-10-18', summary: '주문 경로 속성을 추가했어요' },
    ],
  },
  {
    id: 'e-customer',
    name: '고객',
    nameEn: 'Customer',
    kind: 'entity',
    status: 'published',
    owner: '고객 도메인 팀',
    updatedAt: '2026-10-22',
    projectId: 'p-commerce',
    description: '주문을 하는 사람 또는 조직이에요. 개인 정보는 별도 저장소에 두고 식별자만 연결해요.',
    properties: [
      { name: 'customerId', type: 'string', required: true, description: '고객 식별자' },
      { name: 'segment', type: 'enum', required: false, description: '고객 구분' },
      { name: 'joinedAt', type: 'date', required: true, description: '가입일' },
    ],
    relatedIds: ['e-order', 'r-places'],
    history: [{ at: '2026-10-22', summary: '고객 구분 값 목록을 정리했어요' }],
  },
  {
    id: 'e-product',
    name: '상품',
    nameEn: 'Product',
    kind: 'entity',
    status: 'review',
    owner: '상품 도메인 팀',
    updatedAt: '2026-10-25',
    projectId: 'p-commerce',
    description: '판매 단위예요. 옵션이 다르면 다른 상품으로 봐요.',
    properties: [
      { name: 'sku', type: 'string', required: true, description: '재고 관리 코드' },
      { name: 'name', type: 'string', required: true, description: '상품명' },
      { name: 'price', type: 'decimal', required: true, description: '판매가' },
    ],
    relatedIds: ['e-order', 'e-stock', 'l-reorder'],
    history: [{ at: '2026-10-25', summary: '판매가 속성 설명을 고쳤어요(확인 대기)' }],
  },
  {
    id: 'e-stock',
    name: '재고',
    nameEn: 'Stock',
    kind: 'entity',
    status: 'warning',
    owner: '물류 도메인 팀',
    updatedAt: '2026-10-26',
    projectId: 'p-supply',
    description: '창고별 상품 수량이에요. 원천 데이터 동기화가 하루 늦어지고 있어요.',
    properties: [
      { name: 'warehouseId', type: 'string', required: true, description: '창고 식별자' },
      { name: 'sku', type: 'string', required: true, description: '재고 관리 코드' },
      { name: 'quantity', type: 'integer', required: true, description: '가용 수량' },
    ],
    relatedIds: ['e-product', 'e-warehouse', 'l-reorder'],
    history: [{ at: '2026-10-26', summary: '원천 동기화 지연 경고가 생겼어요' }],
  },
  {
    id: 'e-warehouse',
    name: '창고',
    nameEn: 'Warehouse',
    kind: 'entity',
    status: 'draft',
    owner: '물류 도메인 팀',
    updatedAt: '2026-10-20',
    projectId: 'p-supply',
    description: '상품을 보관하는 장소예요. 지역 코드로 묶어요.',
    properties: [
      { name: 'warehouseId', type: 'string', required: true, description: '창고 식별자' },
      { name: 'region', type: 'string', required: false, description: '지역 코드' },
    ],
    relatedIds: ['e-stock'],
    history: [{ at: '2026-10-20', summary: '초안을 만들었어요' }],
  },
  {
    id: 'r-places',
    name: '주문함',
    nameEn: 'places',
    kind: 'relation',
    status: 'published',
    owner: '주문 도메인 팀',
    updatedAt: '2026-10-19',
    projectId: 'p-commerce',
    description: '고객과 주문을 잇는 관계예요. 고객 한 명은 주문 여러 건을 가질 수 있어요.',
    properties: [{ name: 'cardinality', type: 'enum', required: true, description: '1:N' }],
    relatedIds: ['e-customer', 'e-order'],
    history: [{ at: '2026-10-19', summary: '관계 방향을 고객에서 주문으로 정했어요' }],
  },
  {
    id: 'l-reorder',
    name: '재주문 기준',
    nameEn: 'Reorder rule',
    kind: 'logic',
    status: 'review',
    owner: '물류 도메인 팀',
    updatedAt: '2026-10-25',
    projectId: 'p-supply',
    description: '가용 수량이 안전 재고보다 적으면 재주문 대상으로 표시해요.',
    properties: [{ name: 'threshold', type: 'integer', required: true, description: '안전 재고 수량' }],
    relatedIds: ['e-stock', 'e-product'],
    history: [{ at: '2026-10-25', summary: '안전 재고 수량 기준을 바꿨어요(확인 대기)' }],
  },
  {
    id: 'a-cancel',
    name: '주문 취소',
    nameEn: 'Cancel order',
    kind: 'action',
    status: 'draft',
    owner: '주문 도메인 팀',
    updatedAt: '2026-10-23',
    projectId: 'p-commerce',
    description: '배송 전 주문을 취소하고 결제를 되돌리는 동작이에요.',
    properties: [{ name: 'reason', type: 'string', required: true, description: '취소 사유' }],
    relatedIds: ['e-order'],
    history: [{ at: '2026-10-23', summary: '취소 사유를 필수로 정했어요' }],
  },
]

export const projects: Project[] = [
  {
    id: 'p-commerce',
    name: '주문 처리 온톨로지',
    summary: '주문 · 고객 · 상품과 그 사이 관계를 정리하는 프로젝트예요.',
    owner: '주문 도메인 팀',
    status: 'review',
    elementIds: ['e-order', 'e-customer', 'e-product', 'r-places', 'a-cancel'],
  },
  {
    id: 'p-supply',
    name: '재고 예측 파일럿',
    summary: '재고 · 창고 데이터로 재주문 시점을 미리 알리는 파일럿이에요.',
    owner: '물류 도메인 팀',
    status: 'warning',
    elementIds: ['e-stock', 'e-warehouse', 'l-reorder'],
  },
]

/** 통합 뷰 보조 상자의 「확인 필요」 항목 */
export const reviewQueue = elements.filter((e) => e.status === 'review' || e.status === 'warning')

export function findElement(id: string): OntologyElement | undefined {
  return elements.find((e) => e.id === id)
}

export function findProject(id: string): Project | undefined {
  return projects.find((p) => p.id === id)
}
