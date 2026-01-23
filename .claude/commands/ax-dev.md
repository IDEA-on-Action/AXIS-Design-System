# ax-dev

개발 서버를 시작합니다.

## 기본 사용법

```
/ax-dev [대상]
```

## 개발 서버 옵션

| 인자 | 명령어 | 설명 |
|------|--------|------|
| (없음) | `pnpm dev:web` | 문서 사이트 개발 서버 |
| `web` | `pnpm dev:web` | 문서 사이트 (apps/web) |
| `all` | `pnpm dev` | 모든 패키지 watch 모드 |

## 실행 명령

### 기본 (web)
```bash
pnpm dev:web
```

### 전체
```bash
pnpm dev
```

## 개발 환경 확인

서버 시작 전 확인사항:

1. **의존성 설치 확인**
```bash
pnpm install
```

2. **포트 충돌 확인**
- 기본 포트: 3000 (Next.js)

## 출력 형식

```
## 개발 서버 시작

### 대상: [web/all]
### URL: http://localhost:3000

서버가 시작되었습니다.
변경사항이 자동으로 반영됩니다.

### 종료 방법
Ctrl+C로 서버를 종료할 수 있습니다.
```

## 병렬 개발

여러 패키지를 동시에 개발할 때:
```bash
pnpm dev
```

이 명령은 Turborepo의 watch 모드를 활용하여 모든 패키지의 변경사항을 감지합니다.

## 문제 해결

### 포트 충돌
```bash
# 다른 포트로 실행
pnpm dev:web -- -p 3001
```

### 캐시 문제
```bash
pnpm clean && pnpm install && pnpm dev:web
```
