Soobo-MBTI Backend API

환경 변수 (.env)

PORT=4000
MONGODB_URI=mongodb://localhost:27017/soobo-mbti

실행

npm run dev
또는
npm start

엔드포인트

GET /health: 헬스체크
POST /api/sessions: 세션 생성 → { sessionId } 반환
PUT /api/sessions/:sessionId/answers: 응답 배열 저장/업서트
요청 본문 예시 (JSON):
{
  "answers": [
    {"questionId": "Q1", "choiceId": "A", "value": 2},
    {"questionId": "Q2", "choiceId": "B", "value": -1}
  ]
}
POST /api/sessions/:sessionId/complete: 최종 결과 확정 및(선택) 응답 동시 저장
요청 본문 예시 (JSON):
{
  "resultType": "INTJ",
  "resultScores": {"I": 10, "E": -3, "N": 8, "S": -2, "T": 5, "F": -1, "J": 7, "P": -4},
  "answers": [
    {"questionId": "Q1", "choiceId": "A", "value": 2}
  ]
}
GET /api/sessions/:sessionId: 세션 전체 조회


