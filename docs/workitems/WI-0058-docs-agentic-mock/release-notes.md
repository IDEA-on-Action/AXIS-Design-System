# WI-0058 릴리스 노트: 문서 사이트 agentic 페이지를 실제 컴포넌트로

> 작성일: 2026-10-24 | WI: WI-0058 | GitHub: #157 | changeset: 없음(`apps/web` 만 바뀜, npm 배포 없음, Cloudflare Pages 재배포)

## 변경 사항

- **실컴포넌트 렌더**: `/agentic` 문서 18페이지가 모두 `@axis-ds/agentic-ui` 의 실제 컴포넌트를 렌더해요. 16페이지는 페이지 안 mock 을 지우고 import 로 바꿨어요. 이제 사이트에서 보이는 결함이 곧 컴포넌트 결함이에요
- **SurfaceRenderer 문서**: 패키지에 없는 API(`A2UISurface` · `context.onAction` · 10종 type)를 설명하던 내용을 실제 API(`surface` · `renderCustom` · `className`, type `text · code · table · chart · form · custom`)로 다시 썼어요. 코드 예시의 import 경로를 `@axis-ds/agentic-ui` 로 고쳤어요
- **ApprovalCard 문서**: `/agentic/approval-dialog` 경로는 그대로 두고(cli 별칭 `approval-card → approval-dialog`, WI-0057), 내용을 패키지의 `ApprovalCard`(title · description · severity · actions · children)로 바꿨어요. 사이드바 · agentic 인덱스 이름도 `ApprovalCard` 예요
- **하이드레이션 오류 해소**: message-bubble · step-timeline 페이지의 React #418 을 없앴어요. 데모 시각을 마운트한 뒤에만 만들어요(`apps/web/src/lib/use-client-now.ts`)
- **데모 접근성**: token-usage-indicator 데모 슬라이더에 label 을 연결했어요
- **Props 표**: streaming-text `className`, tool-call-card `description` · `className` 을 더했어요

## 알려진 한계

- 실컴포넌트로 바꾸면서 컴포넌트 결함이 사이트에 드러나요(측정 상세는 [testplan.md](./testplan.md) 4절). 대비 결함은 WI-0062(#170), 비대비 결함(MessageBubble aria-prohibited-attr · CodeBlock 스크롤 영역 포커스 등)은 WI-0069(#183) 에서 고쳐요. ContextPanel provider 4.39 · "컨텍스트" 라벨 4.23(기본) · 3.5(ontology) 는 WI-0062 목록에 없던 쌍이에요
- a11y 게이트 PAGES 는 그대로라, 새로 실렌더되는 페이지의 회귀는 게이트가 아직 지키지 않아요(PAGES 확장은 WI-0062)
- surface-renderer 의 text surface 는 `prose` 클래스를 쓰지만 사이트에 typography 플러그인이 없어 효과가 없어요. WI-0046 이 컴포넌트를 바꾼 뒤 다시 재요
- `/components` 의 mock 페이지는 WI-0066(progress 는 WI-0046)에서 다뤄요
