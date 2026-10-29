# WI-0098: Yarn PnP 의 Tailwind 3 content 판정 릴리스 노트

> **발행**(2026-10-29, cli 1.7.7 · mcp 1.4.6). 2026-10-28 작성, 같은 날 구현 뒤 재측정 반영. 구판 수치는 발행본 1.7.6 · 1.4.5, 신판 수치는 worktree 빌드(cli · mcp dist)로 같은 실설치 fixture 51행을 다시 잰 값이에요. 안내 문구는 사용자 결정 Q44 · Q45 · Q47(2026-10-28)로 확정했어요
> 대상: `@axis-ds/cli` patch · `@axis-ds/mcp` patch | GitHub: #242
> 발행: 2026-10-29, WI-0097(#241) · WI-0100(#244)과 Version PR #251(머지 1e8da06) 하나로 cli 1.7.7 · mcp 1.4.6, publish run 40811479954, provenance 2/2(둘 다 slsa provenance v1). 이 WI 는 #252(be61b74)로 머지했어요. linked 4패키지(tokens · theme · ui-react · agentic-ui)는 1.8.2 그대로예요

## 바뀐 점

- Yarn Plug'n'Play(`.pnp.cjs`)에서 Tailwind 3 `content` 가 `./node_modules/@axis-ds/ui-react/...`(agentic-ui 도 같음)나 `./**/*.{js,mjs}` 로만 컴포넌트 패키지를 덮으면 `axis check` · MCP `axis.check_project` 의 `tailwind.content` 가 PASS 대신 **WARN** 이에요. PnP 에는 node_modules 가 없어 그 경로는 스캔되지 않고, 실제 빌드에서 컴포넌트 클래스가 하나도 생기지 않았어요(측정: 빌드 규칙 4, glob 이 없을 때와 바이트 같음, 정상 429). Tailwind 의 `**` · `*` 는 `.yarn` 처럼 점으로 시작하는 디렉터리를 넘지 않아서, 앱이 PnP 루트이고 unplugged 를 설정한 프로젝트에서도 `./**` 는 WARN 이에요(사용자 결정 Q33, 측정: 빌드 규칙 4 인데 1.7.6 은 PASS). 종료 코드는 0 그대로예요.
- PnP 에서 FAIL · WARN 문구와 `axis theme add` 의 안내가 더는 `./node_modules/...` 를 권하지 않아요. `require.resolve` 로 실제 위치를 넣는 동적 content 형태를 먼저, `dependenciesMeta` 의 `unplugged: true` 설정을 대안으로 안내해요. 안내에는 덮지 않은 패키지 이름이 들어가 그대로 복사해 쓸 수 있어요(사용자 결정 Q31, 측정: 복사한 동적 형태로 빌드 429). 이미 unplugged 디렉터리가 있는 패키지는 `dependenciesMeta` 설정 안내를 빼고 `.yarn/unplugged` 정적 경로 제안만 내요(사용자 결정 Q45). 종전 안내를 따르면 PASS 가 됐지만 빌드는 그대로 깨져 있었어요.
  - 안내 예(기본 PnP, ui-react): `Plug'n'Play 에는 node_modules 가 없습니다. content 에 path.join(path.dirname(require.resolve("@axis-ds/ui-react")), "..", "dist/**/*.{js,mjs}") 처럼 실제 위치를 넣으세요(정적으로 확인할 수 없어 WARN 으로 남습니다). 정적 경로를 쓰려면 package.json 의 dependenciesMeta 에 "@axis-ds/ui-react": { "unplugged": true } 를 두고 yarn install 뒤 .yarn/unplugged 경로를 넣으세요`
  - 안내 예(unplugged 디렉터리가 있음): 목록 항목 `@axis-ds/ui-react → "../../.yarn/unplugged/*/node_modules/@axis-ds/ui-react/dist/**/*.{js,mjs}"` 뒤에 `Plug'n'Play 에는 node_modules 가 없습니다. content 에 path.join(path.dirname(require.resolve("@axis-ds/ui-react")), "..", "dist/**/*.{js,mjs}") 처럼 실제 위치를 넣으세요(정적으로 확인할 수 없어 WARN 으로 남습니다).` 만 붙어요
- unplugged 를 설정한 PnP 프로젝트는 `.yarn/unplugged/*/node_modules/<패키지>` 를 가리키는 glob(상대 · 절대, `.yarn` 을 글자 그대로 쓴 것)을 덮음으로 인정해요. 앱 `package.json` 의 선언 범위에 맞는 버전의 디렉터리만 봐요. **이 경우 check 종료 코드가 1 에서 0 으로 바뀔 수 있어요**(사용자 결정 Q29, 다른 항목이 모두 PASS 일 때, 측정: 빌드 429 인데 1.7.6 은 FAIL).
- PnP 에서 컴포넌트 패키지를 워크스페이스 루트 `package.json` 에만 선언한 앱은 content 경로를 안내 · 인정하지 않고 「워크스페이스 루트에만 선언돼 Plug'n'Play 에서 앱이 해석하지 못합니다 → 앱 package.json 에 선언하세요」를 내요(사용자 결정 Q22). 이 앱에 동적 형태를 넣으면 빌드가 `MODULE_NOT_FOUND` 로 실패했어요(측정).
- `axis theme add` 는 PnP 에서 `./node_modules` glob 만 있을 때 content 안내를 내지 않던 침묵을 없애고 check 와 같은 안내를 내요. theme add 종료 코드는 0 그대로예요.
- 상위 경로(`../`) content 제안 뒤에 붙는 안내의 어미를 다른 check 문구와 같은 합니다체로 맞췄어요(사용자 결정 Q47, 「…기준으로 풀려요.」 → 「…기준으로 풀립니다.」). 경로 · 코드 조각 · 의미와 종료 코드 · 판정은 그대로예요. check · MCP `axis.check_project` · `axis theme add` 가 같은 문구를 써서 PnP 가 아닌 호이스팅 레이아웃의 출력도 이 어미만큼 바뀌어요.
  - 새 문구: `상위 경로는 Tailwind 3 가 빌드를 실행한 디렉터리 기준으로 풀립니다. 모노레포 루트 등 앱 디렉터리 밖에서 빌드하면 content: { relative: true, files: [...] } 로 설정 파일 기준으로 바꾸세요`

## 종료 코드 영향 요약

| 경우 | 1.7.6 | 1.7.7 |
|---|---|---|
| PnP + `./node_modules` · `./**` glob(앱이 PnP 루트인 unplugged 프로젝트 포함) | PASS, rc 0 | WARN, rc 0 |
| PnP unplugged + unplugged glob | FAIL, rc 1 | PASS, rc 0(Q29) |
| PnP + 패키지 glob 없음 · 캐시 zip 경로 glob | FAIL, rc 1 | FAIL, rc 1(안내만 바뀜) |
| PnP + 동적 `require.resolve` | WARN, rc 0 | WARN, rc 0(안내만 바뀜) |
| PnP 가 아닌 레이아웃 | - | 바뀌지 않음 |

신판 재측정(2026-10-28, Yarn 4.5.3 · Tailwind CLI 3.4.19): PnP 37행 가운데 PASS → WARN 11행(nm · broad, 루트 전용 Q4 · Q4u 포함), FAIL → PASS 4행(Q3 · P3 unplugged 상대 · 절대, 빌드는 모두 정상 429 와 바이트 같음), 나머지는 severity · 종료 코드 그대로 문구만 바뀌었어요. 0 → 1 은 0행이에요. Q31 · Q33 반영 뒤 같은 51행을 다시 재서 직전 신판과 비교하면 27행은 출력이 바이트 같고 24행(check · MCP 48개 파일)은 안내의 `<패키지>` 자리가 패키지 이름으로 채워진 것만 달라요(빌드 · severity · rc 차이 0). PnP 루트 앱 + unplugged 단일 프로젝트(S1) 8행은 모두 빌드 정답과 맞아요(broad · `./*/**` · 절대 broad WARN 빌드 4, unplugged 상대 · 절대 PASS 빌드 429, `./.yarn/**` PASS 빌드 435, none FAIL). Yarn node-modules 대조군 14행은 check · MCP 출력 28개와 theme add 출력 3개가 구판과 바이트 같아요. CLI · MCP 문구는 51행 모두 같아요. Q44 · Q45 반영 뒤 다시 재서 Q31 · Q33 반영본과 비교하면 빌드 · severity · rc · 줄 수 차이는 0행이고, 바뀐 것은 안내의 합니다체(check · MCP 32개 파일 · theme add 4개)와 unplugged Q3 · P3 의 none · nm · broad · dyn 에서 설정 안내 문장이 빠진 것(check · MCP 16개 파일 · theme add 2개)뿐이에요. Yarn node-modules 대조군 31건은 다시 재도 발행본과 바이트 같아요. Q47 반영 뒤 다시 재서 Q44 · Q45 반영본과 비교하면 옛 상위 경로 안내를 새 문구로 치환한 뒤 차이 0(check · MCP 32개 파일 · theme add 4개가 치환만큼 다름, 빌드 · severity · rc · 줄 수 차이 0행)이고, Yarn node-modules 대조군 31건은 발행본과 비교해 13건 바이트 같음 · 18건 같은 치환 뒤 같음이에요.

업데이트 뒤 check 종료 코드가 0 에서 1 로 바뀌는 경우는 없어요.

## 바뀌지 않은 점

- npm · pnpm(기본 · hoisted) · Yarn node-modules · 단일 프로젝트의 content 판정 · 종료 코드는 그대로이고, 문구 · theme add 출력도 상위 경로 안내의 어미(Q47) 말고는 그대로예요(실설치 바이트 대조는 Yarn node-modules 14행, 나머지 레이아웃은 WI-0080 MATRIX · WI-0090 · mcp WI-0080 단위 테스트 회귀 가드로 확인).
- Tailwind 4 의 content 판정은 이 변경과 무관해요(WI-0097).
- `.pnp.cjs` 를 찾는 규칙(`.git` 에서 멈춤)은 그대로예요.
- `axis init` 의 안내는 바꾸지 않았어요(WI-0095).

## 발행본 재측정 (2026-10-29)

발행본 dist 를 main 1e8da06 로컬 빌드와 비교하니 코드 파일은 바이트가 같았어요(cli 46 · mcp 36개 파일). 다른 것은 `dist/registry/index.json` · `registry.json` 의 version 필드뿐이에요(로컬 1.5.0 은 커밋된 `apps/web/public/r/index.json` 사본이고, 발행본 1.8.2 는 CI 가 레지스트리를 다시 만든 값이라 pages.dev `/r/index.json` 과 같아요). 발행본 CLI `axis check` 와 MCP `axis.check_project` 의 판정 줄은 이 WI 의 PnP 앱 fixture 21개에서 모두 같았고 출력이 빈 것은 0개예요. 1.7.6 발행본 대비 판정 줄이 바뀐 것은 PnP 앱 21/21 이에요(세 WI 를 합치면 바뀐 fixture 91개).

## 잔여 · 알려진 한계

- 캐시 zip 파일 이름을 그대로 쓴 glob 은 빌드가 정상인데도 FAIL 이에요. zip 경로는 해시가 들어 있어 판독하지 않아요(사용자 결정 Q23). 안내대로 동적 형태로 바꾸면 rc 0 이에요.
- 기본 PnP(unplugged 없음)에서는 정적으로 PASS 를 받을 방법이 없어요. 동적 형태는 정적으로 확인할 수 없어 WARN 으로 남아요. PASS 가 필요하면 unplugged 를 설정하세요.
- 루트 전용 선언 + unplugged 프로젝트에서 unplugged glob 은 빌드가 정상(429)인데 FAIL 이에요(측정 Q4u). 루트 전용은 경로를 인정하지 않는 결정(Q22)의 알려진 한계예요. 앱 `package.json` 에 선언하면 PASS 로 돌아가요.
- unplugged 인정은 앱 `package.json` 의 선언 범위만 보고(범위를 읽지 못하면 인정하지 않음) `yarn.lock` 의 실제 해석 버전은 보지 않아요(사용자 결정 Q34). 범위 선언(`^1.8.0`) 앱에서 범위 안의 다른 버전(1.8.3) unplugged 디렉터리만 가리키는 glob 도 PASS 예요(합성 fixture 로 측정, 실설치 재현 안 함). 서로 다른 워크스페이스가 범위 안의 두 버전을 함께 unplug 해야 생겨요.
- unplugged 안내 glob 은 와일드카드라 이전 버전 unplugged 디렉터리가 남아 있으면 함께 스캔할 수 있어요(미측정).
- `.yarnrc.yml` 의 `pnpUnpluggedFolder` 로 위치를 바꾼 경우, `pnpMode: loose` · `pnpFallbackMode: all`, Yarn 2 · 3, Next.js(postcss) 빌드, agentic-ui 실빌드, Windows 경로, ESM(`tailwind.config.mjs`) · `.ts` 설정에서 동적 형태 안내의 동작(`require` 가 없음)은 재지 않았어요.
- 문서는 `packages/axis-cli/README.md` 와 `docs/guides/troubleshooting.md` 만 고쳤어요. quick-start · 패키지 README · theme-customization 가이드와 ontology-console 템플릿의 `./node_modules` 안내는 그대로예요(사용자 결정 Q27, 별도 WI).
