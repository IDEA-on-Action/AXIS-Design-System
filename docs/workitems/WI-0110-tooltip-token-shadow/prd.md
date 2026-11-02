# WI-0110: Tooltip 토큰 그림자 PRD

> 작성일: 2026-11-02 | 버전: v1.0 | WI: WI-0110 | GitHub: #283 | 상태: 진행 중
> 상위: project-todo 125(WI-0108 범위 밖으로 남긴 Tooltip 그림자) | 기준: `main` e3ba6c9
> 표기: **측정**(이번에 실행해 얻은 값) · **계산** · **추정**(실행하지 않음)

## 1. 배경

- WI-0107 · WI-0108 에서 떠 있는 레이어 6종(Dialog · SelectContent · Toast · PopoverContent · DropdownMenuContent · SubContent · SheetContent)의 그림자를 토큰 `shadow-[shadow:var(--axis-shadow-lg)]` 로 맞췄어요. TooltipContent 는 그림자가 없어서 범위 밖으로 남겼어요.
- 현재 TooltipContent(`packages/axis-ui-react/src/tooltip/index.tsx`)는 포털로 렌더되고 `z-50 overflow-hidden rounded-md bg-[var(--axis-surface-inverse)] px-3 py-1.5 text-xs text-[var(--axis-text-inverse)]` 이에요. 그림자 · 테두리 · 화살표가 없어요(측정: TooltipArrow 사용 0건).
- tooltip 은 레지스트리 항목이 아니에요(`registry.json` items 11개에 없음, 측정). 그래서 npm 패키지 `@axis-ds/ui-react` 로만 나가고 cli · mcp 는 관계가 없어요.

## 2. 사용자 결정(2026-11-02)

| ID | 결정 |
|---|---|
| D1 | TooltipContent 에 다른 떠 있는 레이어와 같은 토큰 `--axis-shadow-lg` 그림자를 넣어요. 측정 결과(아래 3절)를 확인한 뒤에도 lg 를 유지해요 |
| D2 | 테두리 · 화살표 · 열림 제어(WI-0073 래퍼) 로직은 그대로 둬요 |
| D3 | `docs/guides/troubleshooting.md` 5절 버전표에 「1.8.6 · TooltipContent · 없음」 행을 더하고, 「없음이면 `shadow-none` 으로 종전 모양」 주석을 붙여요 |
| D4 | 기본 브랜드 어두운 테마에서 lg 그림자가 거의 보이지 않는 문제(다른 6종도 같음)는 후속 후보로 등록하고 release-notes 한계 절에 적어요 |
| D5 | 발행은 ui-react patch(WI-0108 선례), agentic-ui 는 내부 의존으로 함께 올라가요 |

## 3. 조사 측정(2026-11-02, 최소 HTML + Tailwind 3.4.19 + tokens dist, Playwright chromium)

| 브랜드 · 테마 | `--axis-shadow-lg` | 툴팁 배경 | 그림자 아래 범위 |
|---|---|---|---|
| 기본 · 밝음 | `0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)` | #111827 | 19px |
| 기본 · 어두움 | 같음 | #F3F4F6 | 19px(차이 최대 7/765, 거의 안 보임) |
| ontology · 밝음 | `0 8px 24px rgba(17,20,24,.10)` | #111418 | 28px |
| ontology · 어두움 | `0 8px 24px rgba(0,0,0,.50)` | #F1F3F5 | 36px |

- 툴팁 높이는 28px 이에요. side=top 이면 그림자가 트리거 위로 15 ~ 32px 내려와요(계산).
- 참고(측정): 어두운 툴팁에 그림자를 두지 않는 시스템이 많아요(shadcn new-york-v4 · Radix Themes · Primer · MUI). Ant Design 은 옅은 그림자를 둬요.

## 4. 요구사항

- FR-1: TooltipContent 기본 클래스 문자열에 `shadow-[shadow:var(--axis-shadow-lg)]` 를 더해요. 사용자 `className` 은 지금처럼 마지막에 병합해요(패키지 `cn` 의 그림자 그룹 병합으로 `shadow-none` 등이 대체).
- FR-2: `overlay-shadow.test.tsx` 에 TooltipContent 렌더 단언을 더해요(토큰 있음 · 고정 그림자 없음 · `shadow-none` 대체).
- FR-3: 라이브러리 상세 데이터를 `pnpm library:refresh-axis` 로 재생성해요. 다시 돌려서 변경 0 을 확인해요(CI 게이트가 없어 사람이 확인).
- FR-4: troubleshooting 5절 반영(D3).
- FR-5: changeset(ui-react patch)에 바뀐 모양과 끄는 방법을 적어요. 예상 · 내부 설명은 changeset 에 넣지 않아요(CHANGELOG 로 발행됨).

## 5. 수용 기준

- AC1: TooltipContent 의 className 에 토큰 그림자가 있고 고정 그림자가 없어요. HEAD 소스에서는 이 단언이 실패해요(음성 대조).
- AC2: `className="shadow-none"` 이 토큰 그림자를 대체해요(회귀 방지용, HEAD 에서도 통과하므로 판별력은 없음).
- AC3: 변이(토큰을 `shadow-md` 로 바꿈)에서 렌더 단언과 소스 검사가 실패해요.
- AC4: 문서 페이지에서 툴팁을 열어 잰 브라우저 계산값이 브랜드 · 테마별 토큰 값과 같아요(계산값 형식으로 대조).
- AC5: Tailwind 3 · 4 에서 컴포넌트 dist 만 스캔해도 클래스가 생성돼요(같은 문자열이 다른 6종에 이미 있음).
- AC6: turbo build · type-check · lint · test `--force`(Cached 0), check-changeset-mcp-tokens, check-token-refs 통과.

## 6. 범위 밖

- TooltipArrow 내보내기. 소비자가 Radix Arrow 를 넣으면 화살표 윤곽에는 그림자가 없어요(측정, release-notes 한계).
- 테두리 추가, 툴팁 전용 그림자 토큰 신설, 어두운 테마 토큰 값 조정(D4 후속).
