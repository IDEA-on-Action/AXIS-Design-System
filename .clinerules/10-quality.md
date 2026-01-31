# 10-quality (Cline)

## Quality Gates

구현 후 반드시 검증 실행:

```bash
pnpm type-check  # 타입 체크
pnpm lint        # 린트
pnpm build       # 빌드
```

## Testing

- 테스트가 없다면 최소한의 단위 테스트부터 추가
- 새 기능/버그 수정 시 관련 테스트 추가 권장
- 기존 테스트 통과 필수

## Documentation

기능/동작 변경 시:
- WI의 todo.md 체크 상태 업데이트
- testplan.md에 케이스 추가/갱신
- release-notes.md에 사용자 영향/검증 방법 기록

## Definition of Done

AGENTS.md의 Definition of Done을 따름
