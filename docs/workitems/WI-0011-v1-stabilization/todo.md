# WI-0011 TODO — v1.0 안정화

> PRD: [prd.md](./prd.md) | 상태: ✅ 완료

---

## AC1: 테스트 커버리지 확보

- [x] ui-react 핵심 컴포넌트 단위 테스트 작성 (Button, Input, Avatar, Badge, Card, Alert)
- [x] agentic-ui 핵심 컴포넌트 단위 테스트 작성 (AgentAvatar, ThinkingIndicator, AgentMessageBubble, ToolCallCard, CodeBlock)
- [x] 테마 시스템(axis-theme) 테스트 작성
- [x] `pnpm test` 전체 통과 확인

## AC2: 빌드 및 타입 검증

- [x] `pnpm build` 전 패키지 빌드 성공
- [x] `pnpm type-check` 통과
- [x] `pnpm lint` 통과

## AC3: 문서 사이트 검수

- [x] 전체 페이지 접근 가능 여부 확인
- [x] 깨진 링크 검출 및 수정
- [x] 컴포넌트 API 문서 정확성 검토
- [x] 사용 예제 동작 확인

## AC4: npm 배포 검증

- [x] npm dry-run 배포 실행 (전 패키지)
- [x] 배포 산출물(dist) 내용 검증
- [x] 패키지 의존성 정확성 확인

## AC5: CHANGELOG 작성

- [x] CHANGELOG.md v1.0.0 섹션 작성
- [x] Phase 0~7 주요 변경사항 정리
- [x] Breaking changes 명시 (해당 시)

## AC6: 버전 범핑

- [x] 전 패키지 package.json 버전 1.0.0으로 갱신
- [x] 패키지 간 내부 의존성 버전 정합성 확인

---

## Definition of Done

- [x] 타입 체크 통과
- [x] 린트 통과
- [x] 빌드 성공
- [x] 테스트 통과
- [x] 문서 업데이트 완료
- [x] CHANGELOG 작성 완료
