# Wrap-up Skill (작업 정리)

작업 내용을 정리하고, 테스트 검증 후 Git 커밋을 수행합니다.
**GitHub Project 동기화 및 Slack 알림을 지원합니다.**

## 트리거

- `/wrap-up` 명령
- "작업 정리" 프롬프트

## 실행 흐름

```
1단계: 변경 사항 수집
    ↓
2단계: 문서 업데이트 확인
    ↓
3단계: 테스트 실행
    ↓
4단계: 테스트 결과 처리
    ↓
5단계: Git 커밋
    ↓
6단계: 외부 시스템 동기화
    ├─ GitHub Push
    ├─ GitHub Project 업데이트 (선택)
    └─ Slack 알림 전송 (선택)
```

---

## 빠른 시작

### 1. 환경 변수 설정

프로젝트 루트에 `.env` 파일 생성:

```bash
# 필수: 프로젝트 정보
PROJECT_NAME=My Project

# 필수: GitHub 설정
GITHUB_ORG=your-org
GITHUB_REPO=your-repo

# 선택: GitHub Project 동기화
GITHUB_PROJECT_NUMBER=1

# 선택: Slack 알림
SLACK_WEBHOOK_URL=<your-webhook-url>
```

### 2. 사용

```bash
/wrap-up                # 기본 실행
/wrap-up --no-sync      # 로컬 커밋만
/wrap-up --dry-run      # 미리보기
```

---

## 환경 변수

| 변수 | 필수 | 설명 | 예시 |
|------|------|------|------|
| `PROJECT_NAME` | ✅ | 프로젝트 이름 (알림에 표시) | My Project |
| `GITHUB_ORG` | ✅ | GitHub Organization/User | my-org |
| `GITHUB_REPO` | ✅ | GitHub Repository | my-repo |
| `GITHUB_PROJECT_NUMBER` | ❌ | GitHub Project 번호 | 1 |
| `SLACK_WEBHOOK_URL` | ❌ | Slack Incoming Webhook URL | https://hooks.slack.com/... |
| `SLACK_CHANNEL` | ❌ | Slack 채널 (기본: Webhook 설정) | #dev-alerts |

---

## 실행 단계 상세

### 1단계: 변경 사항 수집

```bash
git status
git diff --stat
```

### 2단계: 문서 업데이트 확인

| 문서 | 업데이트 조건 |
|------|--------------|
| `changelog.md` | 기능 추가/변경/수정 시 |
| `README.md` | 주요 변경 시 |

### 3단계: 테스트 실행

**Python 프로젝트:**
```bash
ruff check .
mypy .
pytest tests/
```

**TypeScript 프로젝트:**
```bash
pnpm lint
pnpm typecheck
pnpm test
```

**Go 프로젝트:**
```bash
go vet ./...
go test ./...
```

### 4단계: 테스트 결과 처리

| 결과 | 동작 |
|------|------|
| ✅ 통과 | 커밋 진행 |
| ❌ 실패 | 중단, 수정 제안 |
| ⚠️ 경고 | 사용자 확인 후 진행 |

### 5단계: Git 커밋

```bash
git add -A
git commit -m "<type>: <description>

Co-Authored-By: Claude <noreply@anthropic.com>"
```

**커밋 타입:**
- `feat`: 새 기능
- `fix`: 버그 수정
- `docs`: 문서
- `refactor`: 리팩토링
- `test`: 테스트
- `chore`: 기타

### 6단계: 외부 시스템 동기화

#### GitHub Push
```bash
git push
```

#### GitHub Project 업데이트 (GITHUB_PROJECT_NUMBER 설정 시)
```bash
gh issue close <number> --repo ${GITHUB_ORG}/${GITHUB_REPO}
gh issue create --repo ${GITHUB_ORG}/${GITHUB_REPO} --title "..." --body "..."
gh project item-add ${GITHUB_PROJECT_NUMBER} --owner ${GITHUB_ORG} --url <issue_url>
```

#### Slack 알림 (SLACK_WEBHOOK_URL 설정 시)
```bash
curl -X POST "${SLACK_WEBHOOK_URL}" \
  -H "Content-Type: application/json" \
  -d '{
    "blocks": [
      {"type": "header", "text": {"type": "plain_text", "text": "Build Notification"}},
      {"type": "section", "fields": [
        {"type": "mrkdwn", "text": "*Commit:*\n${commit_hash}"},
        {"type": "mrkdwn", "text": "*Files:*\n${file_count}"}
      ]},
      {"type": "section", "text": {"type": "mrkdwn", "text": "*Message:*\n${commit_message}"}},
      {"type": "context", "elements": [
        {"type": "mrkdwn", "text": "<${github_url}|View on GitHub>"}
      ]}
    ]
  }'
```

---

## 옵션

| 옵션 | 설명 |
|------|------|
| `--skip-docs` | 문서 업데이트 건너뛰기 |
| `--skip-test` | 테스트 건너뛰기 |
| `--auto` | 모든 확인 자동 승인 |
| `--dry-run` | 미리보기 (커밋 없음) |
| `--no-sync` | 동기화 건너뛰기 |
| `--sync-github` | GitHub Project만 동기화 |
| `--sync-slack` | Slack만 알림 |

---

## Slack 설정 가이드

### 1. Slack App 생성

1. [api.slack.com/apps](https://api.slack.com/apps) 접속
2. **Create New App** → **From scratch**
3. App 이름 입력, Workspace 선택
4. **Create App**

### 2. Incoming Webhook 활성화

1. 좌측 메뉴 → **Incoming Webhooks**
2. **Activate Incoming Webhooks** → ON
3. **Add New Webhook to Workspace**
4. 채널 선택 → **Allow**

### 3. Webhook URL 복사

생성된 URL을 `.env`에 설정:
```bash
SLACK_WEBHOOK_URL=<your-webhook-url>
```

### 4. 테스트

```bash
curl -X POST "${SLACK_WEBHOOK_URL}" \
  -H "Content-Type: application/json" \
  -d '{"text": "Test message"}'
```

> ⚠️ Webhook URL을 Git에 커밋하지 마세요. `.gitignore`에 `.env` 추가 필수.

---

## 출력 예시

```
🔄 작업 정리 시작...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 1. 변경 사항 수집
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

수정된 파일 (2개):
  M src/app.ts
  A tests/app.test.ts

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧪 2. 테스트 실행
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[lint] ✅ 0 errors
[test] ✅ 10 passed

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💾 3. Git 커밋
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ 커밋 완료: abc1234

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📤 4. 외부 시스템 동기화
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🐙 GitHub Push: ✅
💬 Slack: ✅
```

---

## 에러 처리

| 에러 | 해결 방법 |
|------|----------|
| 테스트 실패 | 테스트 수정 후 재실행 |
| Git 충돌 | 충돌 해결 후 재실행 |
| 변경 없음 | 변경 사항 확인 |
| GitHub 실패 | `gh auth status` 확인 |
| Slack 실패 | Webhook URL 확인 |

---

## 관련 문서

- [GitHub CLI Manual](https://cli.github.com/manual/)
- [Slack Incoming Webhooks](https://api.slack.com/messaging/webhooks)
