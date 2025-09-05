# Node.js 18 이미지 사용 (안정성 우선)
FROM node:18-slim

# 작업 디렉토리 설정
WORKDIR /app

# 패키지 파일들 복사
COPY package*.json ./

# 의존성 설치 (안전한 방법)
RUN npm install --production --no-audit --no-fund && \
    npm cache clean --force

# 소스 코드 복사
COPY . .

# 포트 노출
EXPOSE 4000

# 헬스체크 추가
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# 애플리케이션 시작
CMD ["node", "server.js"]
