/**
 * 발행 채널 가드 (BUG1 재발 방지)
 *
 * workspace:* 의존을 가진 패키지를 `npm publish`로 발행하면 npm이 workspace 프로토콜을
 * 해석하지 못해 그대로 누출 → 외부 `npm install` 실패(1.1.2 실측).
 * pnpm publish / changeset publish / CI는 발행 시 workspace를 실제 버전으로 치환한다.
 *
 * 이 가드는 prepublishOnly에서 실행되어, pnpm 계열 발행자가 아니면 발행을 차단한다.
 * (npm publish는 prepublishOnly를 동일하게 실행하므로 여기서 잡힌다)
 */
const ua = process.env.npm_config_user_agent || '';

if (!/^pnpm\//.test(ua)) {
  console.error('\n[guard] npm publish 차단 - workspace 프로토콜 누출 위험');
  console.error('  이 패키지는 pnpm으로 발행하세요:');
  console.error('    pnpm release            (루트, changeset publish)');
  console.error('    또는 CI publish.yml');
  console.error(`  현재 user-agent: ${ua || '(없음)'}\n`);
  process.exit(1);
}
