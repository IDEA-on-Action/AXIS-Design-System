# WI-0098: Yarn PnP 의 Tailwind 3 content 판정 릴리스 노트

> **초안 · 미발행**(2026-10-28 작성). 수치는 조사 단계 측정(발행본 1.7.6 · 1.4.5) 기준이고, 신판 동작은 구현 · 재측정 뒤 이 문서를 갱신해요
> 대상: `@axis-ds/cli` patch · `@axis-ds/mcp` patch | GitHub: #242
> 발행 예정: WI-0097(#241) · WI-0100(#244)과 Version PR 하나로 cli 1.7.7 · mcp 1.4.6. linked 4패키지(tokens · theme · ui-react · agentic-ui)는 1.8.2 그대로예요

## 바뀐 점

- Yarn Plug'n'Play(`.pnp.cjs`)에서 Tailwind 3 `content` 가 `./node_modules/@axis-ds/ui-react/...`(agentic-ui 도 같음)나 `./**/*.{js,mjs}` 로만 컴포넌트 패키지를 덮으면 `axis check` · MCP `axis.check_project` 의 `tailwind.content` 가 PASS 대신 **WARN** 이에요. PnP 에는 node_modules 가 없어 그 경로는 스캔되지 않고, 실제 빌드에서 컴포넌트 클래스가 하나도 생기지 않았어요(측정: 빌드 규칙 4, glob 이 없을 때와 바이트 같음, 정상 429). 종료 코드는 0 그대로예요.
- PnP 에서 FAIL · WARN 문구와 `axis theme add` 의 안내가 더는 `./node_modules/...` 를 권하지 않아요. `require.resolve` 로 실제 위치를 넣는 동적 content 형태를 먼저, `dependenciesMeta` 의 `unplugged: true` 설정을 대안으로 안내해요. 종전 안내를 따르면 PASS 가 됐지만 빌드는 그대로 깨져 있었어요.
- unplugged 를 설정한 PnP 프로젝트는 `.yarn/unplugged/*/node_modules/<패키지>` 를 가리키는 glob(상대 · 절대)을 덮음으로 인정해요. 앱 `package.json` 의 선언 범위에 맞는 버전의 디렉터리만 봐요. **이 경우 check 종료 코드가 1 에서 0 으로 바뀔 수 있어요**(사용자 결정 Q29, 다른 항목이 모두 PASS 일 때, 측정: 빌드 429 인데 1.7.6 은 FAIL).
- PnP 에서 컴포넌트 패키지를 워크스페이스 루트 `package.json` 에만 선언한 앱은 content 경로를 안내 · 인정하지 않고 「워크스페이스 루트에만 선언돼 Plug'n'Play 에서 앱이 해석하지 못합니다 → 앱 package.json 에 선언하세요」를 내요(사용자 결정 Q22). 이 앱에 동적 형태를 넣으면 빌드가 `MODULE_NOT_FOUND` 로 실패했어요(측정).
- `axis theme add` 는 PnP 에서 `./node_modules` glob 만 있을 때 content 안내를 내지 않던 침묵을 없애고 check 와 같은 안내를 내요. theme add 종료 코드는 0 그대로예요.

## 종료 코드 영향 요약

| 경우 | 1.7.6 | 1.7.7 |
|---|---|---|
| PnP + `./node_modules` · `./**` glob | PASS, rc 0 | WARN, rc 0 |
| PnP unplugged + unplugged glob | FAIL, rc 1 | PASS, rc 0(Q29) |
| PnP + 패키지 glob 없음 · 캐시 zip 경로 glob | FAIL, rc 1 | FAIL, rc 1(안내만 바뀜) |
| PnP + 동적 `require.resolve` | WARN, rc 0 | WARN, rc 0(안내만 바뀜) |
| PnP 가 아닌 레이아웃 | - | 바뀌지 않음 |

업데이트 뒤 check 종료 코드가 0 에서 1 로 바뀌는 경우는 없어요.

## 바뀌지 않은 점

- npm · pnpm(기본 · hoisted) · Yarn node-modules · 단일 프로젝트의 content 판정 · 문구 · theme add 출력은 그대로예요.
- Tailwind 4 의 content 판정은 이 변경과 무관해요(WI-0097).
- `.pnp.cjs` 를 찾는 규칙(`.git` 에서 멈춤)은 그대로예요.
- `axis init` 의 안내는 바꾸지 않았어요(WI-0095).

## 잔여 · 알려진 한계

- 캐시 zip 파일 이름을 그대로 쓴 glob 은 빌드가 정상인데도 FAIL 이에요. zip 경로는 해시가 들어 있어 판독하지 않아요(사용자 결정 Q23). 안내대로 동적 형태로 바꾸면 rc 0 이에요.
- 기본 PnP(unplugged 없음)에서는 정적으로 PASS 를 받을 방법이 없어요. 동적 형태는 정적으로 확인할 수 없어 WARN 으로 남아요. PASS 가 필요하면 unplugged 를 설정하세요.
- unplugged 안내 glob 은 와일드카드라 이전 버전 unplugged 디렉터리가 남아 있으면 함께 스캔할 수 있어요(미측정).
- `.yarnrc.yml` 의 `pnpUnpluggedFolder` 로 위치를 바꾼 경우, `pnpMode: loose` · `pnpFallbackMode: all`, Yarn 2 · 3, Next.js(postcss) 빌드, agentic-ui 실빌드, Windows 경로, ESM(`tailwind.config.mjs`) · `.ts` 설정에서 동적 형태 안내의 동작(`require` 가 없음)은 재지 않았어요.
- 문서는 `packages/axis-cli/README.md` 와 `docs/guides/troubleshooting.md` 만 고쳤어요. quick-start · 패키지 README · theme-customization 가이드와 ontology-console 템플릿의 `./node_modules` 안내는 그대로예요(사용자 결정 Q27, 별도 WI).
