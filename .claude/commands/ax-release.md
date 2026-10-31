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

WI 작업인 경우 `/ax-wi end`를 실행하세요.
WI가 아닌 경우: project-todo.md 상태만 갱신하고 CHANGELOG.md를 업데이트합니다.

## 7. npm 배포 인증 · 비상 경로 (CLAUDE.md 에서 옮김)

```bash
pnpm release                    # build + changeset publish (전체 패키지)  (평소 배포는 CI 경로)
pnpm publish -r --access public --no-git-checks  # 비상용 수동 배포: 로컬은 대화형 2FA(OTP) 필요, provenance 없음. 평소에는 CI(OIDC) 경로를 씀
```

- **npm 스코프**: `@axis-ds` (npmjs.com 조직)
- **인증**: npm Trusted Publishing(OIDC). `publish.yml`이 `id-token: write`와 `npm@11.19.1`로 발행 (1.2.1에서 실측, 2026-10-17). `NPM_TOKEN` secret과 npm granular 토큰은 삭제함(2026-10-17). Publishing access는 linked 4패키지만 「disallow bypass 2fa tokens」로 바꿨고(사용자 설정, 2026-10-17), cli · mcp는 1.1.4 OIDC publish를 확인했으니(2026-10-17) 같은 설정으로 변경할 차례. 프로젝트 `.npmrc`에는 인증 라인 없음
- **Trusted publisher**: linked 4패키지(tokens · ui-react · agentic-ui · theme) 와 cli · mcp 모두 등록(`IDEA-on-Action/AXIS-Design-System` · `publish.yml`). cli · mcp는 2026-10-17 등록 후 1.1.4를 OIDC로 첫 발행해 확정(#106)
- **publish 부수효과**(로컬 수동 배포 때만): 각 패키지 디렉토리에 `.npmrc` 복사본 생성됨 - 커밋 불필요, 삭제 권장
- **CI 배포**: `.github/workflows/publish.yml` - main push 시 changesets/action이 OIDC로 발행 (npm 인증용 GitHub Secret 불필요)
