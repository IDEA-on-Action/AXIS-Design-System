# ax-release

릴리스 준비를 위한 체크리스트를 실행합니다.

## 사용법

```
/ax-release [버전]
```

### 버전 형식
- `major` - 메이저 버전 업 (X.0.0)
- `minor` - 마이너 버전 업 (0.X.0)
- `patch` - 패치 버전 업 (0.0.X)
- `X.Y.Z` - 직접 버전 지정

## 릴리스 체크리스트

### 1. 코드 품질 확인
```bash
pnpm type-check
pnpm lint
pnpm build
```

### 2. 테스트 실행
```bash
pnpm test
```

### 3. Git 상태 확인
```bash
git status
git log --oneline -5
```

### 4. 변경사항 요약
- 새로운 기능
- 버그 수정
- Breaking Changes

### 5. 버전 업데이트 대상
| 패키지 | 현재 버전 | 변경 여부 |
|--------|-----------|-----------|
| @axis-ds/tokens | X.Y.Z | ✅/❌ |
| @axis-ds/ui-react | X.Y.Z | ✅/❌ |
| @axis-ds/agentic-ui | X.Y.Z | ✅/❌ |
| @axis-ds/theme | X.Y.Z | ✅/❌ |
| @axis-ds/cli | X.Y.Z | ✅/❌ |

## 출력 형식

```
## 릴리스 준비 체크리스트

### 대상 버전: [버전]

### 코드 품질
- [ ] 타입 체크 통과
- [ ] 린트 통과
- [ ] 빌드 성공
- [ ] 테스트 통과

### 변경사항 요약
#### 새로운 기능
- [기능 1]

#### 버그 수정
- [수정 1]

#### Breaking Changes
- [있다면 작성]

### 업데이트 대상 패키지
[패키지 목록]

### 다음 단계
1. CHANGELOG 업데이트
2. 버전 범프
3. 태그 생성
4. npm 배포
```

## 버전 범프 명령어

### 패치 버전
```bash
pnpm version patch
```

### 마이너 버전
```bash
pnpm version minor
```

### 메이저 버전
```bash
pnpm version major
```

## 주의사항

- Breaking Changes가 있으면 메이저 버전 업데이트 권장
- 모든 패키지의 버전을 동기화할 것인지 확인
- CHANGELOG.md 업데이트 필수
- 릴리스 전 main 브랜치 최신화 확인

---

## 6. 현행화 체크리스트 (필수)

릴리스 완료 후 반드시 아래 현행화를 수행합니다.

### 6.1 project-todo.md 업데이트

1. 릴리스에 포함된 WI 항목의 상태를 ✅ 완료로 변경
2. 버전 정보 업데이트
3. 완료된 WI를 "완료" 섹션으로 이동

```markdown
## 완료된 작업 (v0.7.0)
| WI ID | 항목 | 완료일 |
|-------|------|--------|
| WI-0001 | Button 컴포넌트 | 2025-01-26 |
```

### 6.2 WI 산출물 검증

릴리스 전 각 WI의 산출물 완성도 확인:

```
# 체크리스트
- [ ] docs/workitems/<WI_ID>/release-notes.md 작성됨
- [ ] docs/workitems/<WI_ID>/todo.md 모든 항목 완료
- [ ] docs/workitems/<WI_ID>/testplan.md 테스트 통과
```

### 6.3 CHANGELOG.md 동기화

1. 릴리스 노트 내용을 CHANGELOG.md 상단에 추가
2. 형식: Keep a Changelog 표준

```markdown
## [0.7.0] - 2025-01-26

### Added
- Button 컴포넌트 (#WI-0001)

### Changed
- ...

### Fixed
- ...
```

### 6.4 현행화 최종 확인

```
### 릴리스 현행화 체크
- [ ] project-todo.md 버전 및 상태 업데이트
- [ ] 모든 관련 WI release-notes.md 작성 확인
- [ ] CHANGELOG.md 업데이트
- [ ] 완료된 WI 항목 "완료" 섹션으로 이동
```
