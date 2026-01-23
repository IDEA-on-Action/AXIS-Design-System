# AX Wrap-up Skill (작업 정리)

SSDD 원칙에 따라 작업 내용을 정리하고, 테스트 검증 후 Git 커밋을 수행합니다.
**GitHub Project 동기화 및 Slack 알림이 기본 제공됩니다.**
동기화를 건너뛰려면 `--no-sync` 옵션을 사용하세요.

## 트리거

- `/ax:wrap-up` 명령
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
6단계: 외부 시스템 동기화 (기본 실행)
    ├─ GitHub Project 업데이트 (gh CLI)
    └─ Slack 알림 전송 (선택)
```

## 실행 단계

### 1단계: 변경 사항 수집

```bash
git status
git diff --stat
```

- 수정된 파일 목록 확인
- 스테이징 상태 확인

### 2단계: 문서 업데이트 확인

SSDD 원칙에 따라 다음 문서들의 업데이트 필요 여부를 확인합니다:

| 문서 | 업데이트 조건 | 체크 항목 |
|------|--------------|----------|
| `changelog.md` | 기능 추가/변경/수정 시 | 변경 내역 기록 |
| `project-todo.md` | 작업 완료/추가 시 | 완료 항목 체크, 새 항목 추가 |
| `CLAUDE.md` | 구조/규칙 변경 시 | 버전, 기술 스택 정보 |
| `docs/specs/*.md` | 스펙 변경 시 | API/모델 스펙 |

### 3단계: 테스트 실행

프로젝트 타입에 따라 적절한 테스트를 실행합니다:

**Python (백엔드)**:
```bash
# Linting
ruff check backend/

# Type checking
mypy backend/

# Unit tests
pytest tests/ -v --tb=short
```

**TypeScript (프론트엔드)**:
```bash
# Type checking
pnpm typecheck

# Linting
pnpm lint

# Unit tests
pnpm test
```

### 4단계: 테스트 결과 처리

| 결과 | 동작 |
|------|------|
| ✅ 모든 테스트 통과 | 5단계(커밋)로 진행 |
| ❌ 테스트 실패 | 실패 내용 보고, 수정 제안 |
| ⚠️ 경고만 있음 | 경고 목록 표시 후 사용자 확인 |

### 5단계: Git 커밋

테스트 통과 시:

```bash
# 변경 파일 스테이징
git add -A

# 커밋 메시지 생성 (Conventional Commits)
git commit -m "<type>: <description>

<body>

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

**커밋 타입**:
- `feat`: 새로운 기능
- `fix`: 버그 수정
- `docs`: 문서 변경
- `refactor`: 리팩토링
- `test`: 테스트 추가/수정
- `chore`: 빌드/설정 변경

### 6단계: 외부 시스템 동기화 (기본 실행)

커밋 완료 후 외부 시스템에 작업 내역을 자동으로 동기화합니다.
`--no-sync` 옵션으로 건너뛸 수 있습니다.

#### 6-1. GitHub Project 업데이트

`gh` CLI를 활용하여 GitHub Project의 Issues 상태를 업데이트합니다.

**동기화 로직**:

```bash
# 1. project-todo.md에서 완료된 항목 추출
# 2. 해당 GitHub Issue를 closed 상태로 변경
# 3. 새로운 미완료 항목이 있으면 Issue 생성
# 4. Project Board에 반영
```

**완료 항목 처리**:

```bash
# project-todo.md에서 완료 항목 패턴: - [x] 항목명
# 해당 Issue 찾아서 close

gh issue close <issue_number> \
  --repo IDEA-on-Action/AXIS-Design-System \
  --comment "✅ 작업 완료 (commit: ${commit_hash})"
```

**새 항목 생성**:

```bash
# project-todo.md에서 미완료 항목 중 Issue가 없는 것 생성

gh issue create \
  --repo IDEA-on-Action/AXIS-Design-System \
  --title "${task_title}" \
  --body "${task_description}" \
  --label "${phase_label}"

# Project에 추가
gh project item-add 4 --owner IDEA-on-Action --url "${issue_url}"
```

**진행 상태 업데이트**:

```bash
# Issue에 status:in-progress 라벨 추가/제거
gh issue edit <issue_number> \
  --repo IDEA-on-Action/AXIS-Design-System \
  --add-label "status:in-progress"
```

#### 6-2. Slack 알림 전송 (선택)

Slack Webhook을 통해 작업 완료 알림을 전송합니다.

```bash
# Slack Webhook으로 알림 전송
curl -X POST "${SLACK_WEBHOOK_URL}" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "🚀 작업 완료 - AXIS Design System",
    "attachments": [{
      "color": "good",
      "fields": [
        {"title": "커밋", "value": "'${commit_hash}'", "short": true},
        {"title": "변경 파일", "value": "'${file_count}'개", "short": true},
        {"title": "메시지", "value": "'${commit_message}'"}
      ]
    }]
  }'
```

## Slack 연동 설정 가이드

Slack 알림을 활성화하려면 다음 단계를 따르세요.

### 1단계: Slack App 생성

1. [Slack API](https://api.slack.com/apps) 접속
2. **Create New App** → **From scratch** 선택
3. App 이름: `AXIS Build Bot` (또는 원하는 이름)
4. Workspace 선택 후 **Create App**

### 2단계: Incoming Webhook 활성화

1. 좌측 메뉴에서 **Incoming Webhooks** 클릭
2. **Activate Incoming Webhooks** 토글 ON
3. **Add New Webhook to Workspace** 클릭
4. 알림 받을 채널 선택 (예: `#dev-notifications`)
5. **Allow** 클릭

### 3단계: Webhook URL 복사

생성된 Webhook URL을 복사합니다:
```
<your-webhook-url>
```

### 4단계: 환경 변수 설정

프로젝트 루트의 `.env` 파일에 추가:

```bash
# Slack 알림 설정
SLACK_WEBHOOK_URL=<your-webhook-url>
SLACK_CHANNEL=#dev-notifications  # 선택사항
```

### 5단계: 테스트

```bash
# Webhook 테스트
curl -X POST "${SLACK_WEBHOOK_URL}" \
  -H "Content-Type: application/json" \
  -d '{"text": "✅ AXIS Design System Slack 연동 테스트 성공!"}'
```

### 보안 주의사항

> ⚠️ **중요**: Webhook URL은 절대 Git에 커밋하지 마세요!
> - `.env` 파일은 `.gitignore`에 포함되어 있어야 합니다
> - CI/CD에서는 GitHub Secrets 사용 권장

## 환경 변수 요구사항

| 변수 | 용도 | 필수 | 예시 |
|------|------|------|------|
| `GITHUB_ORG` | GitHub Organization | ✅ | IDEA-on-Action |
| `GITHUB_REPO` | GitHub Repository | ✅ | AXIS-Design-System |
| `GITHUB_PROJECT_NUMBER` | GitHub Project 번호 | ✅ | 4 |
| `SLACK_WEBHOOK_URL` | Slack Incoming Webhook | ❌ | https://hooks.slack.com/... |
| `SLACK_CHANNEL` | 알림 채널 (기본: Webhook 설정 채널) | ❌ | #dev-notifications |

## 동기화 조건

| 조건 | 동작 |
|------|------|
| 기본 (옵션 없음) | GitHub + Slack 모두 실행 |
| `--no-sync` 옵션 지정 | 동기화 건너뜀 (로컬 커밋만) |
| `--sync-github` | GitHub Project만 실행 |
| `--sync-slack` | Slack만 실행 |
| 환경 변수 미설정 | 해당 동기화 건너뜀 (경고 표시) |

## 자동 판단 로직

### 문서 업데이트 필요 여부

1. **changelog.md 업데이트 필요**:
   - `backend/` 또는 `app/` 디렉토리 변경 시
   - 새 기능 추가 또는 버그 수정 시

2. **project-todo.md 업데이트 필요**:
   - 기존 TODO 항목 완료 시
   - 새로운 작업 항목 발견 시

3. **CLAUDE.md 업데이트 필요**:
   - 버전 변경 시
   - 새로운 에이전트/스킬 추가 시

### 커밋 메시지 자동 생성

변경 내용을 분석하여 적절한 커밋 메시지를 생성합니다:

```
변경 파일 분석 → 변경 유형 판단 → 메시지 초안 생성 → 사용자 확인
```

## 출력 예시

```
🔄 작업 정리 시작...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 1. 변경 사항 수집
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

수정된 파일 (3개):
  M backend/api/routes/inbox.py
  M backend/agent_runtime/workflows/wf_01_seminar.py
  A tests/test_wf_01.py

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 2. 문서 업데이트 확인
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ changelog.md - 업데이트됨
✅ project-todo.md - 업데이트됨
⏭️ CLAUDE.md - 변경 불필요

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧪 3. 테스트 실행
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[ruff] ✅ 0 errors, 0 warnings
[mypy] ✅ Success: no issues found
[pytest] ✅ 15 passed, 0 failed (2.3s)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💾 4. Git 커밋
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📌 커밋 메시지 (자동 생성):

  feat: WF-01 Seminar Pipeline 워크플로 구현

  - Activity 생성 로직 추가
  - Signal 추출 기능 구현
  - AAR 템플릿 자동 생성
  - 단위 테스트 15개 추가

커밋을 진행할까요? [Y/n]:

✅ 커밋 완료!
   commit abc1234: feat: WF-01 Seminar Pipeline 워크플로 구현

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📤 5. 외부 시스템 동기화
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🐙 GitHub Project
   ✅ 업데이트 완료
   Issues closed: 2
   Issues created: 0
   Project: https://github.com/orgs/IDEA-on-Action/projects/4

💬 Slack 알림
   ✅ 전송 완료
   Channel: #dev-notifications
```

## 옵션

| 옵션 | 설명 | 기본값 |
|------|------|--------|
| `--skip-docs` | 문서 업데이트 건너뛰기 | false |
| `--skip-test` | 테스트 건너뛰기 (비권장) | false |
| `--auto` | 모든 확인 자동 승인 | false |
| `--dry-run` | 실제 커밋 없이 미리보기 | false |
| `--no-sync` | 동기화 건너뛰기 (로컬 커밋만) | false |
| `--sync-github` | GitHub Project만 동기화 | false |
| `--sync-slack` | Slack만 알림 | false |

## 에러 처리

| 에러 | 메시지 | 해결 방법 |
|------|--------|----------|
| 테스트 실패 | "테스트 실패로 커밋이 중단되었습니다" | 실패 테스트 수정 후 재실행 |
| 충돌 | "Git 충돌이 감지되었습니다" | 충돌 해결 후 재실행 |
| 변경 없음 | "커밋할 변경 사항이 없습니다" | 작업 확인 |
| GitHub 실패 | "GitHub Project 동기화 실패" | gh auth status 확인, 권한 확인 |
| Slack 실패 | "Slack 알림 전송 실패" | SLACK_WEBHOOK_URL 확인 |
| gh CLI 미인증 | "⚠️ GitHub CLI 인증 필요" | gh auth login 실행 |

## 사용법

```bash
/ax:wrap-up                    # 기본 실행 (커밋 + GitHub + Slack 동기화)
/ax:wrap-up --no-sync          # 로컬 커밋만 (동기화 건너뛰기)
/ax:wrap-up --sync-github      # 커밋 + GitHub Project만 동기화
/ax:wrap-up --sync-slack       # 커밋 + Slack만 알림
/ax:wrap-up --dry-run          # 미리보기 (커밋 없음)
/ax:wrap-up --skip-docs        # 문서 업데이트 건너뛰기
/ax:wrap-up --auto             # 자동 모드 (모든 확인 자동 승인)
```

## 연계 도구

| 도구 | 역할 | 연계 방식 |
|------|------|----------|
| `gh` CLI | GitHub Issue/Project 관리 | gh issue, gh project 명령 |
| Slack Webhook | 알림 전송 | HTTP POST |

## 관련 문서

- [CLAUDE.md](../../../CLAUDE.md) - 프로젝트 개발 문서
- [changelog.md](../../../changelog.md) - 변경 이력
- [project-todo.md](../../../project-todo.md) - 작업 추적
- [GitHub Project](https://github.com/orgs/IDEA-on-Action/projects/4) - GitHub Project Board
- [GitHub CLI Manual](https://cli.github.com/manual/) - gh CLI 공식 문서
- [Slack Incoming Webhooks](https://api.slack.com/messaging/webhooks) - Slack Webhook 가이드
