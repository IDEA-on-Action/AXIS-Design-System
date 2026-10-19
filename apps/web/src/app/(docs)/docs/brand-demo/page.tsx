import { DocPageLayout } from '@/components/doc-page-layout'
import { DocSection } from '@/components/doc-section'
import { BrandThemeControls } from './_components/brand-theme-controls'
import { AgenticUiDemo, BrandOverview, CoreUiDemo, StatusLegend } from './_components/brand-demo-showcase'

/**
 * 브랜드 전환 데모 페이지 (WI-0025 FR-10 · AC7).
 *
 * 서버 페이지 + 클라이언트 섬 구조예요. 브랜드는 `<html data-brand>` 를 직접 붙이고 지우며(기본 = 속성 없음),
 * 이 페이지를 떠나면 속성을 지워 다른 문서 페이지 화면은 바뀌지 않아요.
 * DocSection 의 자동 id 는 한글 제목에서 빈 문자열이 되므로 id 를 직접 줘요.
 */
export default function BrandDemoPage() {
  return (
    <DocPageLayout
      category="Docs"
      categoryHref="/docs"
      title="Brand Theme"
      description="기본 브랜드와 Ontology 브랜드를 라이트 · 다크 테마와 함께 바꿔 보며, 실제 AXIS 패키지 컴포넌트가 어떻게 달라지는지 확인해요. 브랜드 선택은 이 페이지에서만 적용돼요."
    >
      <DocSection title="전환" id="controls">
        <BrandThemeControls />
      </DocSection>
      <DocSection title="한눈에 보는 차이" id="overview">
        <BrandOverview />
      </DocSection>
      <DocSection title="Core UI" id="core-ui">
        <CoreUiDemo />
      </DocSection>
      <DocSection title="Agentic UI" id="agentic-ui">
        <AgenticUiDemo />
      </DocSection>
      <DocSection title="상태 표시" id="status">
        <StatusLegend />
      </DocSection>
    </DocPageLayout>
  )
}
