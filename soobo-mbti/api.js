// 간단한 프론트엔드 API 클라이언트
(() => {
    // 환경별 API 베이스 URL 자동 감지
    function getApiBaseUrl() {
        // 1. 수동 설정 확인 (우선순위 최고)
        const bodyAttrBase = (typeof document !== 'undefined' && document.body && document.body.getAttribute('data-api-base')) || '';
        const globalBase = (typeof window !== 'undefined' && window.API_BASE) || '';
        
        if (bodyAttrBase) return bodyAttrBase;
        if (globalBase) return globalBase;
        
        // 2. 현재 호스트 기반 자동 감지
        if (typeof window !== 'undefined' && window.location) {
            const hostname = window.location.hostname;
            const protocol = window.location.protocol;
            
            // 로컬 개발 환경
            if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0') {
                return 'http://localhost:4000/api';
            }
            
            // 파일 프로토콜 (로컬 파일 열기)
            if (protocol === 'file:') {
                return 'http://localhost:4000/api';
            }
            
            // 운영 환경 (soobo.sijun.dev) - 역프록시 환경에서는 포트 명시 불필요
            if (hostname === 'soobo.sijun.dev') {
                return 'https://soobo.sijun.dev/api';
            }
            
            // 기타 도메인 (HTTPS 환경) - 프로덕션 환경 가정
            if (protocol === 'https:') {
                return `https://${hostname}/api`;
            }
            
            // 기타 도메인 (HTTP 환경) - 개발 환경 가정
            return `http://${hostname}:4000/api`;
        }
        
        // 3. 폴백 (Node.js 환경 등)
        return 'http://localhost:4000/api';
    }
    
    const API_BASE = getApiBaseUrl();

    async function request(path, options = {}) {
        const url = `${API_BASE}${path}`;
        const headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});
        const init = Object.assign({}, options, { headers });
        const res = await fetch(url, init);
        if (!res.ok) {
            let errText = '';
            try { errText = await res.text(); } catch (e) {}
            throw new Error(`Request failed ${res.status}: ${errText}`);
        }
        const text = await res.text();
        try { return text ? JSON.parse(text) : {}; } catch (e) { return {}; }
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


