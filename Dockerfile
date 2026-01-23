# ============================================================
# AX Discovery Portal - Production Dockerfile
# Multi-stage build for optimized Python backend
# ============================================================

# Stage 1: Builder
# 빌드 의존성 설치 및 wheel 생성
FROM python:3.11-slim AS builder

WORKDIR /app

# 빌드 도구 설치
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 의존성 파일 복사 및 wheel 빌드
COPY pyproject.toml ./
RUN pip wheel --no-cache-dir --wheel-dir /wheels .

# ============================================================
# Stage 2: Runtime
# 최소한의 런타임 환경
# ============================================================
FROM python:3.11-slim AS runtime

# 보안: 비-root 사용자 생성
RUN groupadd --gid 1000 appgroup \
    && useradd --uid 1000 --gid appgroup --shell /bin/bash --create-home appuser

WORKDIR /app

# 런타임 의존성 설치 (curl for healthcheck)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# wheel에서 패키지 설치
COPY --from=builder /wheels /wheels
COPY pyproject.toml ./
RUN pip install --no-cache-dir /wheels/*.whl \
    && rm -rf /wheels

# 애플리케이션 코드 복사
COPY backend/ ./backend/

# 디렉토리 권한 설정
RUN chown -R appuser:appgroup /app

# 비-root 사용자로 전환
USER appuser

# 환경 변수
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000

# 헬스체크
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT}/health || exit 1

# 포트 노출
EXPOSE ${PORT}

# 애플리케이션 실행
CMD ["sh", "-c", "uvicorn backend.api.main:app --host 0.0.0.0 --port ${PORT}"]
