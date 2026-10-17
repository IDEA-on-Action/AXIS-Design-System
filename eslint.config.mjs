// AXIS Design System 라이브러리 패키지 공용 ESLint 설정 (WI-0034)
//
// 대상: @axis-ds/tokens · @axis-ds/ui-react · @axis-ds/agentic-ui 의 `eslint .`
// 각 패키지에서 `eslint .` 를 실행하면 ESLint 9 가 상위 디렉터리로 올라가며 이 파일을 찾습니다.
// apps/web 은 자기 eslint.config.mjs(next lint)를 쓰므로 여기서는 검사하지 않습니다.
// ESLint 9 flat config 는 .gitignore 를 자동으로 따르지 않으므로 빌드 산출물을 직접 제외합니다.
import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default [
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/.turbo/**',
      '**/coverage/**',
      'apps/web/**',
      // 초기 커밋부터 남은 미사용 구판 스크립트(SD v3 · require). 빌드는 build-tokens.mjs 만 실행합니다
      'packages/axis-tokens/build-tokens.js',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs['flat/recommended'],
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
  },
];
