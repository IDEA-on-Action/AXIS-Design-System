# 보안 규칙 (Security Rules)

## 민감 정보 처리

다음 패턴의 파일은 민감정보로 간주하여 **열람/복사/커밋 금지**:

- `.env*` (환경 변수)
- `*.key`, `*.pem` (인증서/키)
- `*secret*`, `*credentials*` (자격 증명)
- `id_rsa*` (SSH 키)

## 코드 내 보안

- API 키, 토큰을 하드코딩하지 않음
- 사용자 입력 검증 필수
- XSS, CSRF 방어 고려

## Git 보안

- 민감 정보 커밋 전 `.gitignore` 확인
- 실수로 커밋된 민감 정보는 즉시 삭제 및 키 교체
- Force push 시 주의 (특히 main/master 브랜치)

## 네트워크 보안

- 불필요한 외부 요청 최소화
- HTTPS 사용 권장
- CORS 설정 검토
