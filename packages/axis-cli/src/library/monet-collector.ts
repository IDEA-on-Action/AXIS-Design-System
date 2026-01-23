/**
 * Library Curator - Monet Collector
 *
 * Monet Design (https://monet.design) 레지스트리에서 컴포넌트를 수집합니다.
 * Monet은 공개 API가 제한적이므로 카테고리 메타데이터만 수집합니다.
 */

import type {
  ComponentMeta,
  ComponentListItem,
} from "./types.js";
import { BaseCollector } from "./base-collector.js";

// Monet 카테고리 정의
const MONET_CATEGORIES = [
  { id: "hero", name: "Hero Sections", count: 120, desc: "히어로 섹션 컴포넌트" },
  { id: "feature", name: "Feature Sections", count: 191, desc: "기능 소개 섹션" },
  { id: "testimonial", name: "Testimonials", count: 47, desc: "고객 후기 섹션" },
  { id: "pricing", name: "Pricing Tables", count: 35, desc: "요금제 테이블" },
  { id: "cta", name: "Call to Action", count: 42, desc: "CTA 섹션" },
  { id: "stats", name: "Statistics", count: 28, desc: "통계 섹션" },
  { id: "footer", name: "Footers", count: 38, desc: "푸터 컴포넌트" },
  { id: "header", name: "Headers/Navigation", count: 45, desc: "헤더/네비게이션" },
  { id: "logo-cloud", name: "Logo Clouds", count: 22, desc: "로고 클라우드" },
  { id: "team", name: "Team Sections", count: 31, desc: "팀 소개 섹션" },
  { id: "faq", name: "FAQ Sections", count: 24, desc: "FAQ 섹션" },
  { id: "contact", name: "Contact Forms", count: 29, desc: "문의 폼" },
  { id: "newsletter", name: "Newsletter", count: 18, desc: "뉴스레터 섹션" },
  { id: "landing", name: "Full Landing Pages", count: 28, desc: "랜딩 페이지" },
] as const;

// 카테고리별 예시 컴포넌트
const MONET_EXAMPLES: Record<string, Array<{ id: string; name: string; desc: string }>> = {
  hero: [
    { id: "hero-with-image", name: "Hero with Image", desc: "이미지 배경 히어로" },
    { id: "hero-centered", name: "Hero Centered", desc: "중앙 정렬 히어로" },
    { id: "hero-split", name: "Hero Split", desc: "분할 레이아웃 히어로" },
    { id: "hero-gradient", name: "Hero Gradient", desc: "그라데이션 히어로" },
  ],
  feature: [
    { id: "feature-grid", name: "Feature Grid", desc: "그리드 형식 기능 소개" },
    { id: "feature-alternating", name: "Feature Alternating", desc: "교차 레이아웃" },
    { id: "feature-icons", name: "Feature Icons", desc: "아이콘 기반 기능" },
    { id: "feature-cards", name: "Feature Cards", desc: "카드 형식 기능" },
  ],
  pricing: [
    { id: "pricing-three-tiers", name: "Pricing Three Tiers", desc: "3단 요금제" },
    { id: "pricing-comparison", name: "Pricing Comparison", desc: "비교 테이블" },
    { id: "pricing-toggle", name: "Pricing Toggle", desc: "월/연 토글 요금제" },
  ],
  landing: [
    { id: "deepcon-ai-landing", name: "Deepcon AI Landing", desc: "AI SaaS 랜딩" },
    { id: "saas-landing", name: "SaaS Landing", desc: "SaaS 스타터 랜딩" },
    { id: "agency-landing", name: "Agency Landing", desc: "에이전시 랜딩" },
  ],
  testimonial: [
    { id: "testimonial-carousel", name: "Testimonial Carousel", desc: "캐러셀 후기" },
    { id: "testimonial-grid", name: "Testimonial Grid", desc: "그리드 후기" },
    { id: "testimonial-quote", name: "Testimonial Quote", desc: "인용구 후기" },
  ],
  cta: [
    { id: "cta-simple", name: "CTA Simple", desc: "심플 CTA" },
    { id: "cta-with-image", name: "CTA with Image", desc: "이미지 CTA" },
    { id: "cta-newsletter", name: "CTA Newsletter", desc: "뉴스레터 CTA" },
  ],
};

export class MonetCollector extends BaseCollector {
  readonly sourceType = "monet" as const;

  private baseUrl = "https://www.monet.design";
  private registryUrl = "https://registry.monet.design";

  constructor(options: { apiKey?: string } = {}) {
    super();
    // API 키가 있으면 향후 직접 API 호출에 사용
  }

  /**
   * 컴포넌트 목록 조회
   * Monet은 공개 API가 제한적이므로 정적 메타데이터 반환
   */
  async listComponents(): Promise<ComponentListItem[]> {
    const items: ComponentListItem[] = [];

    for (const category of MONET_CATEGORIES) {
      // 카테고리별 예시 컴포넌트 추가
      const examples = MONET_EXAMPLES[category.id] || [];

      for (const example of examples) {
        items.push({
          id: `monet-${example.id}`,
          name: example.name,
          description: example.desc,
          category: this.mapMonetCategory(category.id),
          source: "monet",
        });
      }

      // 카테고리 자체도 컴포넌트로 추가 (수집 가능한 단위)
      items.push({
        id: `monet-${category.id}`,
        name: category.name,
        description: `${category.desc} (${category.count}개 컴포넌트)`,
        category: this.mapMonetCategory(category.id),
        source: "monet",
      });
    }

    return items;
  }

  /**
   * 단일 컴포넌트 수집
   * Monet API 제한으로 메타데이터만 반환
   */
  async collectComponent(id: string): Promise<ComponentMeta> {
    const name = id.replace("monet-", "");

    // 카테고리 정보 찾기
    const category = MONET_CATEGORIES.find((c) => c.id === name);

    // 예시 컴포넌트 찾기
    let example: { id: string; name: string; desc: string } | undefined;
    for (const [catId, examples] of Object.entries(MONET_EXAMPLES)) {
      const found = examples.find((e) => e.id === name);
      if (found) {
        example = found;
        break;
      }
    }

    const displayName = example?.name || category?.name || name;
    const description = example?.desc || category?.desc || `Monet ${name} component`;
    const monetCategory = category?.id || this.findCategoryForExample(name);

    return this.createBaseMeta(displayName, description, [], {
      registry: "@monet",
      url: `${this.baseUrl}/c?category=${monetCategory || name}`,
    });
  }

  /**
   * Monet 카테고리를 AXIS 카테고리로 매핑
   */
  private mapMonetCategory(monetCategory: string): ComponentListItem["category"] {
    const mapping: Record<string, ComponentListItem["category"]> = {
      hero: "layout",
      feature: "data-display",
      testimonial: "data-display",
      pricing: "data-display",
      cta: "ui",
      stats: "data-display",
      footer: "navigation",
      header: "navigation",
      "logo-cloud": "data-display",
      team: "data-display",
      faq: "data-display",
      contact: "form",
      newsletter: "form",
      landing: "layout",
    };

    return mapping[monetCategory] || "ui";
  }

  /**
   * 예시 컴포넌트의 카테고리 찾기
   */
  private findCategoryForExample(exampleId: string): string | undefined {
    for (const [catId, examples] of Object.entries(MONET_EXAMPLES)) {
      if (examples.some((e) => e.id === exampleId)) {
        return catId;
      }
    }
    return undefined;
  }

  /**
   * 레지스트리 URL에서 컴포넌트 정보 조회 시도
   */
  async tryFetchFromRegistry(name: string): Promise<unknown | null> {
    try {
      const response = await fetch(`${this.registryUrl}/${name}.json`);
      if (response.ok) {
        return await response.json();
      }
    } catch {
      // 조회 실패 무시
    }
    return null;
  }

  /**
   * 카테고리 목록 반환
   */
  getCategories() {
    return MONET_CATEGORIES;
  }

  /**
   * 카테고리별 컴포넌트 수 반환
   */
  getCategoryCount(categoryId: string): number {
    const category = MONET_CATEGORIES.find((c) => c.id === categoryId);
    return category?.count || 0;
  }
}
