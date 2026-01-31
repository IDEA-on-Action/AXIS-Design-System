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

## 6. 현행화 (필수)

WI 작업인 경우 `/ax-wi-end`를 실행하세요.
WI가 아닌 경우: project-todo.md 상태만 갱신하고 CHANGELOG.md를 업데이트합니다.
