# 🚨 문제 해결 가이드

## MongoDB 인증 문제 해결

### MongoServerError: Authentication failed

이 오류는 MongoDB 인증 설정이나 사용자 계정에 문제가 있을 때 발생합니다.

#### 1단계: MongoDB 상태 확인
```bash
# MongoDB 서비스 상태
sudo systemctl status mongod

# MongoDB 로그 확인
sudo tail -50 /var/log/mongodb/mongod.log

# 설정 파일 확인
sudo cat /etc/mongod.conf
```

#### 2단계: 인증 모드 확인 및 임시 비활성화
```bash
# MongoDB 중지
sudo systemctl stop mongod

# 설정 파일 백업
sudo cp /etc/mongod.conf /etc/mongod.conf.backup

# 인증 임시 비활성화 (기존 설정 주석 처리)
sudo sed -i '/^security:/s/^/# /' /etc/mongod.conf
sudo sed -i '/^  authorization:/s/^/# /' /etc/mongod.conf

# MongoDB 재시작
sudo systemctl start mongod
```

#### 3단계: 사용자 생성 (인증 없는 상태)
```bash
# MongoDB Shell 접속
mongosh

# 또는 구버전인 경우
mongo
```

MongoDB Shell에서 실행:
```javascript
// admin 데이터베이스로 전환
use admin

// 기존 사용자 확인
db.getUsers()

// admin 사용자 생성 (없는 경우)
db.createUser({
  user: "admin",
  pwd: "안전한_관리자_패스워드",
  roles: [
    { role: "userAdminAnyDatabase", db: "admin" },
    { role: "readWriteAnyDatabase", db: "admin" },
    { role: "dbAdminAnyDatabase", db: "admin" }
  ]
})

// soobo-mbti 데이터베이스로 전환
use soobo-mbti

// soobo_user 생성
db.createUser({
  user: "soobo_user",
  pwd: "사용자_패스워드",
  roles: [
    { role: "readWrite", db: "soobo-mbti" }
  ]
})

// 생성된 사용자 확인
db.getUsers()

// 종료
exit
```

#### 4단계: 인증 활성화
```bash
# MongoDB 중지
sudo systemctl stop mongod

# 인증 활성화 설정 추가
sudo tee -a /etc/mongod.conf > /dev/null << 'EOF'

security:
  authorization: enabled
EOF

# MongoDB 재시작
sudo systemctl start mongod
```

#### 5단계: 연결 테스트
```bash
# admin 사용자로 테스트
mongosh -u admin -p --authenticationDatabase admin

# soobo_user로 테스트
mongosh -u soobo_user -p --authenticationDatabase soobo-mbti soobo-mbti

# URI 형식으로 테스트
mongosh "mongodb://soobo_user:패스워드@localhost:27017/soobo-mbti?authSource=soobo-mbti"
```

## Docker 관련 문제

### 컨테이너가 시작되지 않음
```bash
# 컨테이너 로그 확인
sudo docker compose logs soobo-mbti

# 컨테이너 상태 확인
sudo docker compose ps

# 이미지 재빌드
sudo docker compose build --no-cache soobo-mbti
```

### MongoDB 컨테이너 문제
```bash
# MongoDB 컨테이너 로그
sudo docker compose logs mongo

# MongoDB 컨테이너 직접 접속
sudo docker exec -it soobo-mbti-mongo mongosh -u admin -p
```

### 환경 변수 문제
```bash
# .env 파일 확인
cat .env.docker

# 환경 변수 테스트
sudo docker compose config
```

## API 연결 문제

### CORS 오류
```bash
# Nginx 설정 확인
sudo nginx -t

# Nginx 로그
sudo tail -f /var/log/nginx/error.log

# 백엔드 CORS 설정 확인
curl -H "Origin: https://soobo.sijun.dev" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     http://localhost:4000/api/sessions
```

### 포트 충돌
```bash
# 포트 사용 상태 확인
sudo netstat -tlnp | grep :4000

# 프로세스 종료 (필요시)
sudo kill -9 $(sudo lsof -t -i:4000)
```

## 일반적인 명령어

### 서비스 재시작
```bash
# MongoDB 재시작
sudo systemctl restart mongod

# Docker 컨테이너 재시작
sudo docker compose restart soobo-mbti

# Nginx 재시작
sudo systemctl restart nginx
```

### 로그 모니터링
```bash
# 실시간 로그 확인
sudo docker compose logs -f soobo-mbti
sudo tail -f /var/log/mongodb/mongod.log
sudo tail -f /var/log/nginx/error.log
```

### 완전 초기화 (최후 수단)
```bash
# 1. 모든 컨테이너 중지
sudo docker compose down

# 2. 볼륨 제거 (데이터 삭제됨!)
sudo docker volume rm soobo-mbti_mongo_data

# 3. 이미지 제거
sudo docker image rm soobo-mbti-backend_soobo-mbti-backend

# 4. 재시작
sudo docker compose up -d --build
```

## 도움 요청시 필요한 정보

문제 해결을 위해 다음 정보를 수집해주세요:

```bash
# 시스템 정보
uname -a
cat /etc/os-release

# MongoDB 정보
mongod --version
sudo systemctl status mongod

# Docker 정보
docker --version
sudo docker compose ps
sudo docker compose logs soobo-mbti --tail=50

# 네트워크 정보
sudo netstat -tlnp | grep -E ':4000|:27017'

# 디스크 공간
df -h
```
