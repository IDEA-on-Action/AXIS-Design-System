# 품질 게이트 (Quality Gates)

## 필수 검증 단계

구현 완료 후 아래 명령을 실행하여 품질을 검증합니다:

```bash
# 타입 체크
pnpm type-check

# 린트
pnpm lint

# 빌드
pnpm build
```

## 테스트 원칙

- 새 기능/버그 수정 시 관련 테스트 추가 권장
- 기존 테스트 통과 필수
- 테스트 명령: `pnpm test` (해당 시)

## 코드 리뷰 체크리스트

- [ ] 타입 안전성 확보
- [ ] 접근성(a11y) 고려
- [ ] 성능 영향 검토
- [ ] Breaking changes 문서화

## Definition of Done

- [ ] 타입 체크 통과
- [ ] 린트 통과
- [ ] 빌드 성공
- [ ] 관련 문서 업데이트 (해당 시)
