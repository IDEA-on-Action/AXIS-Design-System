// AXIS Design System 라이브러리 패키지 공용 ESLint 설정 (WI-0034)
//
// 대상: @axis-ds/tokens · @axis-ds/ui-react · @axis-ds/agentic-ui 의 `eslint .`
//       WI-0039 부터 @axis-ds/cli · @axis-ds/mcp · @axis-ds/registry-core 도 같은 설정으로 검사합니다(theme 은 아직 제외)
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
      // 공개 Props 를 `interface X extends Y {}` 로 두어 소비자의 선언 병합과 .d.ts 이름 표시를 유지합니다
      '@typescript-eslint/no-empty-object-type': ['error', { allowInterfaces: 'with-single-extends' }],
    },
  },
];
