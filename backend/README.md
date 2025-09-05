 # Soobo MBTI Backend API

수면 MBTI 테스트 백엔드 API 서버입니다.

## 🚀 주요 기능

- **세션 관리**: 테스트 세션 생성 및 관리
- **답변 저장**: 사용자 응답 데이터 실시간 저장
- **결과 처리**: MBTI 결과 계산 및 저장
- **데이터 분석**: 통계 및 분석 데이터 조회
- **보안**: CORS, Rate Limiting, Helmet 보안 헤더

## 📋 API 엔드포인트

### 세션 관리
- `POST /api/sessions` - 새 세션 생성
- `GET /api/sessions/:sessionId` - 세션 정보 조회
- `PUT /api/sessions/:sessionId/answers` - 답변 저장/업데이트
- `POST /api/sessions/:sessionId/complete` - 세션 완료

### 데이터 조회 (관리자용)
- `GET /api/data/stats` - 전체 통계
- `GET /api/data/sessions` - 세션 목록 (페이지네이션)
- `GET /api/data/results/:resultType` - 결과 타입별 세션
- `GET /api/data/answers/analysis` - 답변 분석

### 기타
- `GET /health` - 서버 상태 확인
- `GET /` - API 정보

## 🔧 환경 설정

### 필수 환경 변수

```env
# MongoDB 설정
MONGODB_URI=mongodb://localhost:27017/soobo-mbti
MONGODB_USER=soobo_user
MONGODB_PASSWORD=your_password

# 서버 설정
PORT=4000
NODE_ENV=production

# CORS 설정
ALLOWED_ORIGINS=https://soobo.sijun.dev

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🐳 Docker 배포

### 1. MongoDB 사용자 생성 (최초 1회)

MongoDB에 접속하여 사용자를 생성하세요:

```bash
# MongoDB 접속 (최신 버전 - mongosh 사용)
mongosh -u admin -p

# 또는 구버전인 경우
mongo -u admin -p

# soobo-mbti 데이터베이스로 전환
use soobo-mbti

# 사용자 생성
db.createUser({
  user: "soobo_user",
  pwd: "your_secure_password",
  roles: [{ role: "readWrite", db: "soobo-mbti" }]
})
```

### 2. Docker Compose로 배포

```bash
# 환경 변수 파일 생성
cp .env.example .env
# .env 파일 편집하여 실제 값 입력

# 컨테이너 실행
docker compose up -d

# 로그 확인
docker compose logs -f soobo-mbti

# 상태 확인
docker compose ps
```

### 3. 헬스 체크

```bash
curl http://localhost:4000/health
```

## 📊 데이터 구조

### Session 스키마

```javascript
{
  sessionId: String,        // UUID 세션 ID
  answers: [{               // 사용자 답변들
    questionId: String,     // 질문 ID (q1, q2, ...)
    choiceId: String,       // 선택지 ID
    value: Number,          // 선택지 값
    answeredAt: Date        // 답변 시간
  }],
  resultType: String,       // 최종 MBTI 결과
  resultScores: {           // 점수 세부사항
    morning: String,
    control: String,
    rhythm: String,
    recovery: String
  },
  isCompleted: Boolean,     // 완료 여부
  createdAt: Date,          // 생성 시간
  completedAt: Date         // 완료 시간
}
```

## 🔒 보안 기능

- **CORS**: 허용된 도메인에서만 접근 가능
- **Rate Limiting**: IP별 요청 제한
- **Helmet**: 보안 헤더 설정
- **입력 검증**: 데이터 유효성 검증
- **에러 처리**: 안전한 에러 메시지

## 📈 모니터링

### 로그 확인
```bash
# 실시간 로그 확인
docker compose logs -f soobo-mbti

# 특정 라인 수만 확인
docker compose logs --tail=100 soobo-mbti
```

### 컨테이너 상태 확인
```bash
# 컨테이너 상태
docker compose ps

# 리소스 사용량
docker stats soobo-mbti
```

## 🚨 문제 해결

### 일반적인 문제들

1. **MongoDB 연결 실패**
   - MongoDB 서비스가 실행 중인지 확인
   - 인증 정보가 올바른지 확인
   - 네트워크 연결 상태 확인

2. **CORS 오류**
   - `ALLOWED_ORIGINS` 환경 변수 확인
   - 프론트엔드 도메인이 허용 목록에 있는지 확인

3. **Rate Limit 초과**
   - 클라이언트에서 요청 빈도 조절
   - Rate Limit 설정 값 조정

## 🔄 업데이트 및 배포

GitHub Actions를 통한 자동 배포가 설정되어 있습니다:

1. `main` 브랜치에 푸시
2. 자동으로 Docker 이미지 빌드
3. 컨테이너 재시작
4. 헬스 체크 수행

## 📞 지원

문제가 발생하거나 질문이 있으시면 이슈를 등록해주세요.
