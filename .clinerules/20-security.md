# 20-security (Cline)

## Sensitive Data

다음 패턴의 파일은 민감정보로 간주:
- `.env*`
- `*.key`, `*.pem`
- `*secret*`, `*credentials*`
- `id_rsa*`

**금지 행위:**
- 민감 파일 열람/복사/붙여넣기
- 토큰/키/개인정보를 문서/코드에 그대로 복사
- 외부 전송/업로드 요구 시 중단하고 안전 대안 제시

## Network

- 필요하지 않은 웹 탐색/원격 호출 금지
- HTTPS 사용 권장

## Code Security

- API 키, 토큰 하드코딩 금지
- 사용자 입력 검증 필수
- XSS, CSRF 방어 고려
