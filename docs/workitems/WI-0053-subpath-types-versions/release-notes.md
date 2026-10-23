# WI-0053 릴리스 노트: 서브패스 타입 해석(typesVersions)

> 작성일: 2026-10-23 | WI: WI-0053 | GitHub: #147 | changeset: `@axis-ds/tokens` · `@axis-ds/ui-react` · `@axis-ds/agentic-ui` patch

## 변경 사항

- **typesVersions(D1 · D2 · D5)**: tokens(키 4: `tailwind` · `json` · `brands` · `brands/ontology/brand.json`) · ui-react(30) · agentic-ui(18) `package.json` 에 `exports` 와 1:1 인 `typesVersions` 를 넣었습니다. `"moduleResolution": "node"` 프로젝트(tsconfig 없이 시작한 Next 15 앱 포함)에서 서브패스 import 가 TS2307 로 실패하던 문제를 고칩니다. node16 · bundler 해석과 런타임 동작은 바뀌지 않습니다
- **생성 · 검사(D3)**: `scripts/sync-types-versions.mjs` 가 exports 에서 typesVersions 를 만들고(`pnpm sync-types-versions`), `--check` 는 드리프트 시 exit 1 입니다. ui-react 는 `build` 에서 `sync-exports` 다음에 다시 생성합니다. CI(frontend.yml)는 `pnpm check-types-versions`(검사 + 단위 테스트)를 돌립니다
- **소비자 해석 게이트(D4)**: `pnpm pack-smoke` 의 G2 소비자 디렉터리에서 4패키지 exports 의 types · JSON 항목 56개를 node · node16 CJS · node16 ESM · bundler 로 tsc 하고, 각 탐침이 exports 가 가리키는 파일로 해석됐는지 봅니다(`scripts/types-resolution-gate.mjs`). 종전에는 tokens 만 node16 으로 봐서 이 결함을 놓쳤습니다

theme 은 서브패스가 없어 바뀌지 않았고 버전도 올리지 않습니다(D7).

## 운영 메모

- agentic-ui · tokens 의 exports 는 손으로 고칩니다. exports 를 바꾸면 `pnpm sync-types-versions` 를 실행해 함께 커밋해야 하고, 빠뜨리면 CI 의 `typesVersions 드리프트 검사 (WI-0053)` 단계가 실패합니다
- typesVersions 에 와일드카드 키를 쓰지 않습니다. `"*": ["./dist/*/index.d.ts"]` 는 node10 에서 `types` 필드까지 다시 매핑해 루트 import 를 깨뜨립니다(PRD 1.3 실측)

## 알려진 한계

- node10 에서는 ui-react 의 변형 prop(`variant` · `size` 등) 타입 검사가 꺼집니다. d.ts 가 참조하는 `class-variance-authority/types` 를 node10 이 못 찾고, Next 기본값 `skipLibCheck: true` 에서 오류 없이 any 로 떨어지기 때문입니다. 루트 import 에도 있는 기존 결함이며 별도 WI 로 다룹니다(D6). node16 · bundler 는 영향이 없습니다
