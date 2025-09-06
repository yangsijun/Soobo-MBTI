# 🚀 배포 체크리스트

## 📋 배포 전 필수 작업

### 1. 서버 환경 설정 (한번만 수행)

#### Nginx 설정 업데이트
```bash
# 1. Nginx 설정 파일 편집
sudo nano /etc/nginx/sites-available/soobo.sijun.dev

# 2. 다음 내용이 포함되어 있는지 확인:
```

```nginx
server {
    listen 443 ssl http2;
    server_name soobo.sijun.dev;
    
    # 정적 파일 서빙 (프론트엔드)
    location / {
        root /var/www/soobo-mbti;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    
    # ⭐ 중요: API 프록시 설정
    location /api/ {
        proxy_pass http://localhost:4000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Health check
    location /health {
        proxy_pass http://localhost:4000/health;
        proxy_set_header Host $host;
    }
}
```

```bash
# 3. 설정 검증 및 재시작
sudo nginx -t
sudo systemctl reload nginx
```

#### 프론트엔드 파일 배포 위치 확인
```bash
# 프론트엔드 파일들이 다음 위치에 있어야 함:
ls -la /var/www/soobo-mbti/
# 다음 파일들이 있어야 함:
# - index.html
# - question.html  
# - result.html
# - api.js
# - style.css
# - sleep-mbti-calculator.js
# - share.js
# - mbti.json
# - qna.json
# - images/ 폴더
```

### 2. 백엔드 환경 변수 설정

#### .env 파일 생성/확인
```bash
cd /home/runner/apps/soobo-mbti-backend
cat > .env << 'EOF'
NODE_ENV=production
PORT=4000
MONGODB_URI=mongodb://soobo_user:패스워드@localhost:27017/soobo-mbti?authSource=soobo-mbti
MONGODB_USER=soobo_user
MONGODB_PASSWORD=패스워드
ALLOWED_ORIGINS=https://soobo.sijun.dev
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF
```

#### Docker Compose 환경 변수
```bash
cat > .env.docker << 'EOF'
MONGODB_PASSWORD=실제_패스워드
EOF
```

## 🔄 배포 프로세스

### 자동 배포 (GitHub Actions)
- **아무 작업 불필요**: main 브랜치에 푸시하면 자동 배포

### 수동 배포 (필요시)
```bash
# 1. 서버 접속
ssh your-server

# 2. 백엔드 배포
cd /home/runner/apps/soobo-mbti-backend
sudo docker compose down
sudo docker compose up -d --build

# 3. 프론트엔드 배포 (파일 복사)
cp /path/to/soobo-mbti/* /var/www/soobo-mbti/

# 4. 권한 설정
sudo chown -R www-data:www-data /var/www/soobo-mbti
sudo chmod -R 755 /var/www/soobo-mbti
```

## ✅ 배포 후 확인사항

### 1. 백엔드 상태 확인
```bash
# 컨테이너 상태
sudo docker compose ps

# Health Check
curl http://localhost:4000/health

# 로그 확인
sudo docker compose logs soobo-mbti --tail=20
```

### 2. 프론트엔드 접속 테스트
```bash
# 기본 페이지
curl -I https://soobo.sijun.dev

# API 프록시 테스트
curl https://soobo.sijun.dev/api/

# 세션 생성 테스트
curl -X POST https://soobo.sijun.dev/api/sessions
```

### 3. 브라우저에서 완전한 테스트
1. `https://soobo.sijun.dev` 접속
2. 개발자 도구 > 콘솔에서 API URL 확인:
   ```
   🌐 API Base URL: https://soobo.sijun.dev/api
   ```
3. "테스트하기" 버튼 클릭
4. 몇 개 질문 답변 후 결과 페이지까지 정상 진행 확인

## 🚨 문제 해결

### API 호출 실패 시
```bash
# 1. Nginx 로그 확인
sudo tail -f /var/log/nginx/error.log

# 2. 백엔드 로그 확인  
sudo docker compose logs soobo-mbti -f

# 3. 포트 확인
sudo netstat -tlnp | grep :4000
```

### CORS 오류 시
- 백엔드 환경변수 `ALLOWED_ORIGINS` 확인
- Nginx 설정에서 proxy_set_header 확인

## 📞 지원
문제 발생 시 언제든 연락주세요! 🚀
