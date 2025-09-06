// 간단한 프론트엔드 API 클라이언트
(() => {
    // 환경별 API 베이스 URL 자동 감지
    function getApiBaseUrl() {
        // 1. 수동 설정 확인 (우선순위 최고)
        const bodyAttrBase = (typeof document !== 'undefined' && document.body && document.body.getAttribute('data-api-base')) || '';
        const globalBase = (typeof window !== 'undefined' && window.API_BASE) || '';
        
        if (bodyAttrBase) {
            console.log('🔧 API URL - 수동 설정 (data-api-base):', bodyAttrBase);
            return bodyAttrBase;
        }
        if (globalBase) {
            console.log('🔧 API URL - 수동 설정 (window.API_BASE):', globalBase);
            return globalBase;
        }
        
        // 2. 현재 호스트 기반 자동 감지
        if (typeof window !== 'undefined' && window.location) {
            const hostname = window.location.hostname;
            const protocol = window.location.protocol;
            const port = window.location.port;
            
            console.log('🌍 현재 환경:', { hostname, protocol, port, href: window.location.href });
            
            // 로컬 개발 환경
            if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0') {
                const apiUrl = 'http://localhost:4000/api';
                console.log('🏠 개발 환경 감지:', apiUrl);
                return apiUrl;
            }
            
            // 파일 프로토콜 (로컬 파일 열기)
            if (protocol === 'file:') {
                const apiUrl = 'http://localhost:4000/api';
                console.log('📁 파일 프로토콜 감지:', apiUrl);
                return apiUrl;
            }
            
            // 운영 환경 (soobo.sijun.dev) - 역프록시 환경에서는 포트 명시 불필요
            if (hostname === 'soobo.sijun.dev') {
                const apiUrl = 'https://soobo.sijun.dev/api';
                console.log('🚀 운영 환경 감지 (soobo.sijun.dev):', apiUrl);
                return apiUrl;
            }
            
            // 기타 HTTPS 환경 - 프로덕션 환경 가정
            if (protocol === 'https:') {
                const apiUrl = `https://${hostname}/api`;
                console.log('🔒 HTTPS 운영 환경 감지:', apiUrl);
                return apiUrl;
            }
            
            // 기타 HTTP 환경 - 개발 환경 가정  
            const apiUrl = `http://${hostname}:4000/api`;
            console.log('🔓 HTTP 개발 환경 감지:', apiUrl);
            return apiUrl;
        }
        
        // 3. 폴백 (Node.js 환경 등)
        const fallbackUrl = 'http://localhost:4000/api';
        console.log('⚠️ 폴백 URL 사용:', fallbackUrl);
        return fallbackUrl;
    }
    
    const API_BASE = getApiBaseUrl();

    async function request(path, options = {}) {
        const url = `${API_BASE}${path}`;
        console.log('🌐 API 요청:', { url, method: options.method || 'GET' });
        
        const headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});
        const init = Object.assign({}, options, { headers });
        
        try {
            const res = await fetch(url, init);
            console.log('📡 API 응답:', { url, status: res.status, ok: res.ok });
            
            if (!res.ok) {
                let errText = '';
                try { errText = await res.text(); } catch (e) {}
                const error = `Request failed ${res.status}: ${errText}`;
                console.error('❌ API 오류:', error);
                throw new Error(error);
            }
            
            const text = await res.text();
            const result = text ? JSON.parse(text) : {};
            console.log('✅ API 성공:', { url, result });
            return result;
        } catch (error) {
            console.error('💥 API 예외:', { url, error: error.message });
            throw error;
        }
    }

    async function startSession() {
        return request('/sessions', { method: 'POST' });
    }

    async function saveAnswers(sessionId, answers) {
        return request(`/sessions/${encodeURIComponent(sessionId)}/answers`, {
            method: 'PUT',
            body: JSON.stringify({ answers })
        });
    }

    async function completeSession(sessionId, payload) {
        return request(`/sessions/${encodeURIComponent(sessionId)}/complete`, {
            method: 'POST',
            body: JSON.stringify(payload || {})
        });
    }

    function debounce(fn, wait) {
        let t = null;
        return function(...args) {
            if (t) clearTimeout(t);
            t = setTimeout(() => fn.apply(this, args), wait);
        };
    }

    window.ApiClient = {
        API_BASE,
        startSession,
        saveAnswers,
        completeSession,
        debounce
    };
})();


