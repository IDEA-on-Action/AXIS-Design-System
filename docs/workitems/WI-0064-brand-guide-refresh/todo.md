# WI-0064: 브랜드 테마 가이드 현행화 TODO

> PRD: [prd.md](./prd.md) | GitHub: #174

## 1단계 실측 · PRD
- [x] 1.6.0 배포본 새 프로젝트 3개로 브랜드 적용 실측(Tailwind 3 A1 · A2 · A3, Tailwind 4 A · B, Provider 동작 A~H)
- [x] 깜빡임 재측정(스크립트 없음 · 인라인 스크립트 × CPU 1배 · 4배, 각 10회)
- [x] 이슈 #174 항목과 현재 코드 대조, quick-start Tailwind 3 절 A1 구성 결함 추가 발견
- [x] 사용자 결정 반영(D1~D7 권장안 + 반박 major 지적, 2026-10-24), PRD v1.0

## FR-1 · FR-2 · FR-3 theme-customization.md
- [x] 4절 맨 앞 「브랜드 적용 빠른 시작」 체크리스트
- [x] 「개념」 249개 · 1.2.1 서술을 263개 · 1.6.0 변경으로 정정
- [x] 「import 순서」 Tailwind 4 블록에 컴포넌트 `tailwind.css`, Tailwind 3 CSS 파일 순서 · 테두리색
- [x] 「브랜드 적용」 `defaultBrand` 와 해제 · 용도별 표 · WI-0068 링크
- [x] 「선택자와 다크 모드」 `.dark` 하위 요소 정정 · 우회 2가지
- [x] 「Provider 없이 적용 · 첫 화면」 메커니즘 정정 · 인라인 스크립트(대체값 없음)
- [x] ontology 절 PlanCard 새 변수 3개 값

## FR-4 · FR-5 quick-start.md · tokens README
- [x] quick-start Tailwind 3 블록: preset · `css/shadcn` · `plugins: [animate]` · `@import` 를 `@tailwind` 앞으로
- [x] quick-start 3절 「브랜드 적용(선택)」
- [x] tokens README Tailwind 3 Preset 절 css/shadcn · 브랜드 켜기 · 글꼴
- [x] Tailwind 4 비교 문장의 Tailwind 3 테두리색 괄호 정정(quick-start · README)

## FR-6 ③ 머지 뒤 확정 (D7)
- [ ] 묶음 ②(WI-0046) 머지 뒤 rebase: quick-start Tailwind 3 블록 `plugins` 줄이 ② 의 결론(tailwindcss-animate)과 같은지 확인, ② 가 Tailwind 3 블록을 건드렸으면 이 WI 형태로 정리
- [x] 가이드의 HTML 주석 TODO 자리에 `npx @axis-ds/cli theme add ontology` 단락(「cli 로 적용하기」, cli 1.6.0부터) 작성. ③ 이 머지 전이라 rebase 하지 않고 ③ 브랜치(PR #186) 빌드 산출물로 실측(2026-10-25, testplan 5절)
- [x] ③ theme add 의 import 삽입 순서 대조: Tailwind 3 은 `@tailwind` 앞에 tokens/css · css/shadcn · 브랜드로 체크리스트와 같음, Tailwind 4 첫 실행도 같음. 재실행으로 더해진 컴포넌트 `tailwind.css` 는 브랜드 줄 뒤에 들어가고 출력은 「브랜드 앞」이라고 함(③ 쪽 결함으로 보고, 가이드에는 실측대로 서술)
- [x] ③ theme add 의 Provider 예시는 `<html data-brand>` · `setBrand` 이고 `defaultBrand` 를 쓰지 않음. 「`defaultBrand` 와 해제」와 모순 없음, 가이드 · quick-start 에 이유를 적음
- [x] ③ check 의 판정 항목(`tailwind.config` preset WARN · `brand.activation` · `tailwind.content` · `animation`)을 체크리스트 번호에 연결한 표
- [x] HTML 주석 TODO 삭제, cli 테스트 재실행(guidance · init, testplan 5절)
- [x] 검토 지적: ThemeProvider 만 있는 레이아웃도 check `brand.activation` PASS · theme add 예시 없음(testplan 6절). 가이드 · quick-start 에 「PASS 는 켜졌다는 뜻이 아님」을 적고 ③ 쪽에 보고
- [ ] ③ 머지 · 발행 뒤 재대조: cli 버전이 1.6.0 으로 나가는지, 「cli 로 적용하기」에 옮긴 출력 문구(브랜드 켜기 예시 · preset 안내)가 발행본과 같은지

## 검증 · 릴리스
- [x] `guidance.test.ts` · `init.test.ts` 로컬 실행 · 양성 대조(testplan)
- [x] cli 전체 테스트 17파일 662건
- [x] U+2014 0건
- [x] project-todo.md · wi-mapping.json 🔄
- [ ] PR(docs only 체크 0건이 될 수 있음, tokens README 가 packages/** 라 frontend CI 는 돌 것으로 봄) · 로컬 테스트 결과 첨부
