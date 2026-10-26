import { Button } from '@axis-ds/ui-react/button'
import { EntityList } from '../../components/ontology/entity-list'
import { ListHead } from '../../components/ontology/list-head'
import { PageFrame } from '../../components/ontology/page-frame'
import { elements } from '../../lib/demo-data'

/** 목록 페이지: 메뉴의 첫 화면. 머리 · 도구줄(검색 + 필터 칩) · 표 */
export default function EntitiesPage() {
  return (
    <PageFrame>
      <ListHead
        title="요소 목록"
        count={elements.length}
        description="온톨로지를 이루는 엔티티 · 관계 · 로직 · 액션이에요. 줄을 누르면 상세로 가요."
        tools={<Button type="button">새 요소</Button>}
      />
      <EntityList />
    </PageFrame>
  )
}
