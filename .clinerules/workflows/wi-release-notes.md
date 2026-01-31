# WI: 릴리스 노트 (Release Notes)

## Usage

```
/wi-release-notes.md WI-0001 button
```

## Steps

1. WI의 prd/todo/plan/testplan을 읽고 사용자 영향 중심으로 요약한다.

2. git 로그를 확인해 변경 범위를 크로스체크한다:
   ```bash
   git log --oneline --decorate -n 50
   ```

3. release-notes.md 작성:
   - **Summary**: 무엇이 달라졌나
   - **Added / Changed / Fixed**: 변경 내역 분류
   - **Breaking Changes**: 호환성 문제 및 마이그레이션
   - **How to Verify**: 검증 방법
   - **Rollback Plan**: 롤백 가이드
   - **Known Issues**: 알려진 이슈

4. CHANGELOG.md가 있으면 상단에 동일 요약을 업데이트한다.

5. docs/templates/release-notes.md 형식을 참고한다.

---

## SSDD Gate 4 체크

릴리스 노트 완료 전 아래 항목을 확인합니다:

- [ ] release-notes.md 작성됨
- [ ] Breaking change 여부 명시
- [ ] 검증 방법 포함

---

## 현행화

릴리스 노트 작성 완료 후 수행:

### 1. project-todo.md 완료 처리

해당 WI 상태를 ✅ 완료로 변경:

```markdown
| WI-NNNN | [항목명] | P1 | P1 | ✅ | 2025-01-26 |
```

### 2. WI 폴더 최종 상태 확인

모든 산출물이 완성되었는지 확인:

```
docs/workitems/<WI_ID>-<slug>/
├── prd.md           ✅
├── todo.md          ✅ (모든 항목 체크)
├── plan.md          ✅
├── testplan.md      ✅ (테스트 통과)
└── release-notes.md ✅
```

### 3. CHANGELOG.md 업데이트

릴리스 노트 내용을 CHANGELOG.md에 반영:

```markdown
## [Unreleased]

### Added
- [WI-NNNN] 새로운 기능 설명
```

### 4. 다음 WI 제안

project-todo.md를 읽고 다음 우선순위 작업을 안내:

```
다음 추천 작업:
- WI-NNNN: [항목명] (우선순위: P1)
```
