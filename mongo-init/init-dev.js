// 개발환경용 MongoDB 초기화 스크립트
// soobo-mbti 데이터베이스용 사용자 생성

db = db.getSiblingDB('soobo-mbti');

// 개발용 soobo_user 계정 생성
db.createUser({
  user: 'soobo_user',
  pwd: 'soobo_password_dev',
  roles: [
    {
      role: 'readWrite',
      db: 'soobo-mbti'
    }
  ]
});

// 인덱스 생성
db.sessions.createIndex({ "sessionId": 1 }, { unique: true });
db.sessions.createIndex({ "createdAt": -1 });
db.sessions.createIndex({ "isCompleted": 1 });
db.sessions.createIndex({ "resultType": 1 });
db.sessions.createIndex({ "completedAt": -1 });

print('✅ soobo-mbti 개발환경 데이터베이스 초기화 완료');
