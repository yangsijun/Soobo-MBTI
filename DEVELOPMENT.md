# 로컬 개발 환경 설정 가이드

## 문제점
운영환경에서는 완벽히 작동하지만, 로컬 개발환경에서는 CORS 정책으로 인해 API 호출이 차단됩니다.

## 해결 방법

### 방법 1: Docker를 사용한 완전한 로컬 환경 (권장)

1. **개발용 Docker 환경 시작**
   ```bash
   # 프로젝트 루트에서
   docker-compose -f docker-compose.dev.yml up --build
   ```

2. **프론트엔드 파일 접근**
   - `soobo-mbti/index.html`을 브라우저에서 직접 열기
   - 또는 로컬 웹서버 실행:
   ```bash
   cd soobo-mbti
   python3 -m http.server 8080
   # 또는
   npx http-server -p 8080
   ```

3. **환경 정리**
   ```bash
   docker-compose -f docker-compose.dev.yml down
   ```

### 방법 2: 로컬 MongoDB + Node.js 서버

1. **MongoDB 로컬 설치 및 실행**
   ```bash
   # macOS (Homebrew)
   brew install mongodb-community
   brew services start mongodb-community
   
   # 또는 Docker로 MongoDB만 실행
   docker run -d -p 27017:27017 --name mongo-dev mongo:7.0
   ```

2. **백엔드 서버 개발 모드 실행**
   ```bash
   cd backend
   npm install
   npm run dev:local
   ```

3. **프론트엔드 실행**
   ```bash
   cd soobo-mbti
   python3 -m http.server 8080
   ```

### 방법 3: API Base URL 임시 변경

프론트엔드 코드에서 임시로 API 서버 주소를 변경:

```html
<!-- index.html 또는 question.html의 head 태그에 추가 -->
<script>
  window.API_BASE = 'http://localhost:4000/api';
</script>
```

## 개발 스크립트

### 백엔드 스크립트 (backend/package.json)
- `npm run dev:local`: 로컬 개발용 서버 시작 (CORS 허용)
- `npm run docker:dev`: Docker 개발환경 시작
- `npm run docker:dev:build`: Docker 개발환경 빌드 후 시작
- `npm run docker:dev:down`: Docker 개발환경 종료

## 환경별 설정

### 개발환경 (Docker)
- **API 서버**: http://localhost:4000
- **MongoDB**: localhost:27017
- **CORS**: localhost, 127.0.0.1 허용
- **Rate Limiting**: 느슨함 (1000 요청/15분)

### 운영환경
- **API 서버**: https://soobo.sijun.dev (백엔드)
- **프론트엔드**: https://soobo.sijun.dev
- **CORS**: https://soobo.sijun.dev만 허용
- **Rate Limiting**: 엄격함 (100 요청/15분)

## 트러블슈팅

### CORS 에러가 계속 발생하는 경우
1. 서버가 개발 모드로 실행되고 있는지 확인
2. 브라우저 개발자 도구에서 실제 요청 URL 확인
3. `file://` 프로토콜 대신 `http://localhost` 사용

### MongoDB 연결 실패
1. MongoDB 서비스가 실행 중인지 확인
2. 포트 27017이 사용 가능한지 확인
3. Docker의 경우 컨테이너 로그 확인: `docker logs soobo-mongo-dev`

### API 호출 실패
1. 백엔드 서버가 4000번 포트에서 실행 중인지 확인
2. Health check: http://localhost:4000/health
3. 서버 로그에서 에러 메시지 확인

## 추천 개발 워크플로우

1. **전체 환경 시작**
   ```bash
   docker-compose -f docker-compose.dev.yml up --build
   ```

2. **프론트엔드 개발 서버 시작**
   ```bash
   cd soobo-mbti
   python3 -m http.server 8080
   ```

3. **브라우저에서 접속**
   - http://localhost:8080

4. **개발 완료 후 정리**
   ```bash
   docker-compose -f docker-compose.dev.yml down
   ```

이 방법으로 로컬 개발환경에서도 완전한 기능 테스트가 가능합니다.
