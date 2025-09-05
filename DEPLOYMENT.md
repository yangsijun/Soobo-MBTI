# 🚀 Soobo MBTI 배포 가이드

## 📋 배포 전 준비사항

### 1. MongoDB 사용자 계정 생성

서버의 MongoDB에 접속하여 soobo-mbti 서비스용 계정을 생성해주세요.

```bash
# MongoDB에 root 계정으로 접속 (최신 버전)
mongosh -u admin -p

# 구버전 MongoDB인 경우 (5.0 이하)
mongo -u admin -p

# soobo-mbti 데이터베이스로 전환
use soobo-mbti

# 서비스용 사용자 생성
db.createUser({
  user: "soobo_user",
  pwd: "안전한_패스워드_입력", // 실제 안전한 패스워드로 변경
  roles: [
    {
      role: "readWrite",
      db: "soobo-mbti"
    }
  ]
})

# 생성 확인
db.getUsers()
```

### 2. GitHub Secrets 설정

GitHub 레포지토리의 Settings > Secrets and variables > Actions에서 다음 시크릿들을 추가하세요:

- `MONGODB_PASSWORD`: 위에서 생성한 soobo_user 계정의 패스워드
- `MONGO_ROOT_PASSWORD`: MongoDB root 계정의 패스워드

## 🏗️ 서버 환경 설정

### 1. Nginx 설정

`/etc/nginx/sites-available/soobo.sijun.dev` 파일에 다음 설정을 추가:

```nginx
# API 프록시 설정 추가
location /api/ {
    proxy_pass http://localhost:4000/api/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    
    # CORS 헤더 (백엔드에서도 처리하지만 이중 보안)
    add_header 'Access-Control-Allow-Origin' 'https://soobo.sijun.dev' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization, X-Requested-With' always;
    
    # 타임아웃 설정
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
}
```

설정 후 Nginx 재시작:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 2. 방화벽 설정

필요한 포트들을 열어주세요:

```bash
# 포트 4000 (백엔드 API) - 내부 통신용
sudo ufw allow from 127.0.0.1 to any port 4000

# MongoDB 포트 (필요시)
sudo ufw allow from 127.0.0.1 to any port 27017
```

## 🔄 배포 프로세스

### 자동 배포 (권장)

1. 코드를 `main` 브랜치에 푸시하면 자동으로 배포됩니다
2. GitHub Actions에서 배포 진행 상황을 확인할 수 있습니다
3. 배포 완료 후 헬스 체크가 자동으로 실행됩니다

### 수동 배포 (필요시)

```bash
# 1. 서버에 접속
ssh your-server

# 2. 백엔드 디렉토리로 이동
cd /home/runner/apps/soobo-mbti-backend

# 3. 최신 코드 받기 (또는 파일 복사)
git pull origin main

# 4. 환경 변수 파일 확인/생성
cat > .env << 'EOF'
MONGODB_URI=mongodb://soobo_user:패스워드@localhost:27017/soobo-mbti?authSource=admin
MONGODB_USER=soobo_user
MONGODB_PASSWORD=패스워드
PORT=4000
NODE_ENV=production
ALLOWED_ORIGINS=https://soobo.sijun.dev
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF

# 5. Docker Compose용 환경 변수 파일
cat > .env.docker << 'EOF'
MONGODB_PASSWORD=패스워드
MONGO_ROOT_PASSWORD=루트패스워드
EOF

# 6. 컨테이너 재시작
sudo docker compose --env-file .env.docker down
sudo docker compose --env-file .env.docker up -d --build

# 7. 상태 확인
sudo docker compose --env-file .env.docker ps
sudo docker compose --env-file .env.docker logs soobo-mbti --tail=20
```

## 🔍 배포 확인

### 1. 서비스 상태 확인

```bash
# 컨테이너 상태 확인
sudo docker compose ps

# 로그 확인
sudo docker compose logs soobo-mbti --tail=50

# 헬스 체크
curl http://localhost:4000/health
```

### 2. API 엔드포인트 테스트

```bash
# 기본 정보 확인
curl https://soobo.sijun.dev/api/

# 새 세션 생성 테스트
curl -X POST https://soobo.sijun.dev/api/sessions

# 통계 확인 (데이터가 있는 경우)
curl https://soobo.sijun.dev/api/data/stats
```

### 3. 프론트엔드 연동 확인

브라우저에서 `https://soobo.sijun.dev`에 접속하여:
1. 테스트 시작 버튼 클릭
2. 몇 개 질문에 답변
3. 개발자 도구 > Network 탭에서 API 호출 확인

## 🚨 문제 해결

### 일반적인 문제들

1. **컨테이너가 시작되지 않음**
   ```bash
   # 로그 확인
   sudo docker compose logs soobo-mbti
   
   # 환경 변수 확인
   cat .env
   cat .env.docker
   ```

2. **MongoDB 연결 실패**
   ```bash
   # MongoDB 상태 확인
   sudo systemctl status mongod
   
   # MongoDB 로그 확인
   sudo tail -f /var/log/mongodb/mongod.log
   
   # 사용자 계정 확인
   mongosh -u soobo_user -p soobo-mbti
   # 또는 구버전인 경우
   mongo -u soobo_user -p -d soobo-mbti
   ```

3. **API 호출 실패 (CORS)**
   ```bash
   # Nginx 설정 확인
   sudo nginx -t
   
   # Nginx 로그 확인
   sudo tail -f /var/log/nginx/error.log
   ```

4. **포트 충돌**
   ```bash
   # 포트 사용 확인
   sudo netstat -tlnp | grep :4000
   
   # 프로세스 종료 (필요시)
   sudo kill -9 $(sudo lsof -t -i:4000)
   ```

### 로그 확인 명령어

```bash
# 백엔드 애플리케이션 로그
sudo docker compose logs soobo-mbti -f

# Nginx 로그
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# 시스템 로그
sudo journalctl -u docker -f
```

## 📊 모니터링

### 주요 모니터링 포인트

1. **서버 상태**: `curl http://localhost:4000/health`
2. **컨테이너 상태**: `sudo docker compose ps`
3. **리소스 사용량**: `sudo docker stats soobo-mbti`
4. **로그 레벨**: 에러 로그 정기 확인

### 자동 모니터링 스크립트 (선택사항)

```bash
#!/bin/bash
# health-check.sh

if ! curl -f http://localhost:4000/health > /dev/null 2>&1; then
    echo "$(date): Backend health check failed!" | tee -a /var/log/soobo-mbti-health.log
    # 필요시 재시작 로직 추가
    # sudo docker compose restart soobo-mbti
fi
```

## 🔄 업데이트 절차

1. 새 코드를 `main` 브랜치에 푸시
2. GitHub Actions 자동 배포 실행
3. 배포 완료 후 API 엔드포인트 테스트
4. 프론트엔드에서 정상 동작 확인

문제가 발생하면 이전 버전으로 롤백:
```bash
sudo docker compose down
# 이전 이미지로 복원 또는 이전 코드로 재배포
```

## 📞 지원

배포 중 문제가 발생하거나 질문이 있으시면 언제든 말씀해주세요! 🚀
