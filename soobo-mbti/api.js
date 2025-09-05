// 간단한 프론트엔드 API 클라이언트
(() => {
    const DEFAULT_BASE = 'http://localhost:4000/api';
    const bodyAttrBase = (typeof document !== 'undefined' && document.body && document.body.getAttribute('data-api-base')) || '';
    const globalBase = (typeof window !== 'undefined' && window.API_BASE) || '';
    const API_BASE = bodyAttrBase || globalBase || DEFAULT_BASE;

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


