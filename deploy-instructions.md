# 🚨 긴급 배포 해결 방법

## 🔥 현재 문제
운영환경에서 여전히 `http://localhost:4000/api/sessions`를 호출하려고 하는 CORS 오류 발생

## ✅ 즉시 해결 방법

### 1. 업데이트된 파일들을 서버에 배포

다음 파일들이 업데이트되었으므로 서버에 배포해야 합니다:

- `soobo-mbti/api.js` - 강화된 디버깅과 자동 감지 로직
- `soobo-mbti/index.html` - 강제 API URL 설정 추가  
- `soobo-mbti/question.html` - 강제 API URL 설정 추가
- `soobo-mbti/result.html` - 강제 API URL 설정 추가

### 2. 서버 배포 명령어

```bash
# 서버에 접속
ssh your-server

# 프론트엔드 파일들을 운영 위치로 복사
sudo cp -r /path/to/updated/soobo-mbti/* /var/www/soobo-mbti/

# 권한 설정
sudo chown -R www-data:www-data /var/www/soobo-mbti
sudo chmod -R 755 /var/www/soobo-mbti

# 브라우저 캐시 문제 해결을 위해 파일 수정 시간 업데이트
sudo touch /var/www/soobo-mbti/*.js /var/www/soobo-mbti/*.html
```

### 3. 배포 후 테스트

1. **브라우저 캐시 완전 삭제**
   - Chrome: Ctrl+Shift+R (또는 Cmd+Shift+R)
   - 또는 개발자도구 > Network 탭 > "Disable cache" 체크

2. **콘솔에서 디버깅 정보 확인**
   ```
   https://soobo.sijun.dev 접속 후 F12 > Console에서 확인:
   
   🌍 현재 환경: {hostname: "soobo.sijun.dev", protocol: "https:", ...}
   🚀 운영 환경 감지 (soobo.sijun.dev): https://soobo.sijun.dev/api
   ```

3. **API 호출 확인**
   ```
   테스트하기 버튼 클릭 시 콘솔에서:
   🌐 API 요청: {url: "https://soobo.sijun.dev/api/sessions", method: "POST"}
   ```

## 🛠️ 추가된 안전장치

이제 각 HTML 파일에 `data-api-base="https://soobo.sijun.dev/api"` 속성이 추가되어 있어서, 자동 감지가 실패해도 강제로 올바른 URL을 사용합니다.

## 📱 로컬 개발 환경에서 테스트

로컬에서 테스트할 때는 HTML 파일을 다음과 같이 수정하거나:

```html
<!-- 개발용: 속성 제거 또는 변경 -->
<body data-api-base="http://localhost:4000/api">
```

또는 브라우저 콘솔에서 강제로 설정:
```javascript
window.API_BASE = 'http://localhost:4000/api';
```

## 🔍 문제가 계속되면

콘솔 출력을 확인해서 어떤 URL이 감지되는지 알려주세요:
- 🌍 현재 환경 정보
- 🚀/🔒/🏠 어떤 환경으로 감지되는지
- 🌐 실제 API 요청 URL

이 정보로 추가 디버깅을 도와드릴 수 있습니다! 🚀
