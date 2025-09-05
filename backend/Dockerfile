# Node.js 18 Alpine 이미지 사용 (가볍고 보안성 우수)
FROM node:18-alpine

# 작업 디렉토리 설정
WORKDIR /app

# 패키지 파일들 복사
COPY package*.json ./

# 의존성 설치 (프로덕션 모드)
RUN npm ci --only=production && npm cache clean --force

# 소스 코드 복사
COPY . .

# 실행할 사용자 생성 (보안)
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# 파일 권한 설정
RUN chown -R nodejs:nodejs /app
USER nodejs

# 포트 노출
EXPOSE 4000

# 헬스체크 추가
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# 애플리케이션 시작
CMD ["node", "server.js"]
