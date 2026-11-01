# WI-0108: 떠 있는 레이어 토큰 그림자 통일 PRD

> 작성일: 2026-11-01 | 버전: v1.0 | WI: WI-0108 | GitHub: #277 | 상태: 구현 완료(머지 전)
> 상위: WI-0107 testplan 6.1절(Select · Toast 를 토큰 그림자로 바꾼 결정) | 기준: `main` f4c2323
> 표기: **측정**(이번에 실행해 얻은 값) · **계산** · **추정**(실행하지 않음)

## 1. 배경

- WI-0107 에서 SelectContent · Toast 의 그림자를 Dialog 와 같은 토큰 그림자 `shadow-[shadow:var(--axis-shadow-lg)]` 로 바꿨어요. ontology 브랜드는 카드 그림자 `--axis-card-shadow` 만 0 으로 두고 떠 있는 레이어용 `--axis-shadow-lg` 에는 값을 두어 고도를 표현해요.
- 같은 떠 있는 레이어인 PopoverContent(`shadow-md`) · DropdownMenuContent(`shadow-md`) · DropdownMenuSubContent(`shadow-lg`) · SheetContent(`shadow-lg`)는 Tailwind 고정 그림자로 남아 있었어요. 그래서 ontology 브랜드에서 Select 목록과 DropdownMenu 의 그림자가 서로 달랐어요.
- 이 네 컴포넌트는 레지스트리(`apps/web/public/r`)에 없어서 npm 패키지 `@axis-ds/ui-react` 로만 나가요.

## 2. 사용자 결정(2026-11-01)

| ID | 결정 |
|---|---|
| D1 | 떠 있는 레이어를 모두 같은 토큰 `--axis-shadow-lg` 로 맞춰요. `shadow-md` 였던 것도 lg 토큰으로 통일해요(기본 브랜드에서는 조금 진해짐) |
| D2 | 테두리 · 다른 클래스는 그대로 둬요 |

## 3. 요구사항

- FR-1: ui-react · agentic-ui 전체에서 「떠 있는 레이어(포털 · fixed · z-50)인데 Tailwind 고정 그림자를 쓰는 곳」을 전수 조사해 대상을 정해요. 인라인 요소(스위치 손잡이 · 탭 활성 표시 등)는 제외하고 이유를 적어요.
- FR-2: 대상의 그림자를 `shadow-[shadow:var(--axis-shadow-lg)]` 로 바꿔요.
- FR-3: 패키지 `cn` 이 이 클래스를 그림자 그룹으로 병합하는지 tailwind-merge 실제 버전으로 확인해요. 못 하면 확장과 테스트를 더해요.
- FR-4: 배포 CSS 경로(Tailwind 3 `content` · Tailwind 4 `tailwind.css` 의 `@source`)에서 클래스가 생성되는지 확인해요.
- FR-5: changeset(ui-react patch)에 기본 브랜드의 시각 변화(md → lg)를 정확히 적어요.

## 4. 수용 기준

- AC1: 대상 4곳의 className 에 토큰 그림자가 있고 고정 그림자가 없어요(단위 테스트).
- AC2: 떠 있는 레이어 문자열(z-50 · z-[n] · fixed)과 고정 그림자를 함께 가진 소스 문자열이 0건이에요(소스 검사 테스트, 양성 대조 포함).
- AC3: `className="shadow-none"` 이 토큰 그림자를 대체해요.
- AC4: Tailwind 3.4.19 · 4.1.13 에서 컴포넌트별 dist 만 스캔해도 클래스가 생성돼요.
- AC5: 브라우저 계산값이 브랜드 · 테마별 토큰 값과 같아요.
- AC6: turbo build · type-check · lint · test `--force`(Cached 0), pack-smoke, check-changeset-mcp-tokens 통과.

## 5. 범위 밖

- Tooltip 에 그림자를 새로 넣는 것(지금 그림자 없음).
- 사용 예제(`apps/web` 문서 페이지의 `Command className="... shadow-md"` 등 소비자 코드).
- 그림자 색 수식어 지원(토큰 그림자는 색까지 값에 들어 있어 `shadow-black/50` 이 적용되지 않음, Dialog 와 같은 동작).
