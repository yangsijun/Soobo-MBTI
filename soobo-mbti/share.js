(function() {
    const shareButton = document.getElementById('share-btn');
    const overlay = document.getElementById('share-overlay');
    const sheet = document.getElementById('share-sheet');
    const cancelButton = document.getElementById('share-cancel');

    function openSheet() {
        overlay.hidden = false;
        sheet.setAttribute('aria-hidden', 'false');
        sheet.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeSheet() {
        sheet.classList.remove('active');
        sheet.setAttribute('aria-hidden', 'true');
        overlay.hidden = true;
        document.body.style.overflow = '';
    }

    function getShareData() {
        const url = window.location.href;
        const title = document.title || '수면 MBTI 테스트';
        const text = '수면 MBTI 테스트를 해보세요!';
        return { title, text, url };
    }

    function openPopup(url) {
        const dualScreenLeft = window.screenLeft !== undefined ? window.screenLeft : window.screenX;
        const dualScreenTop = window.screenTop !== undefined ? window.screenTop : window.screenY;
        const width = 520;
        const height = 600;
        const left = (window.innerWidth / 2) - (width / 2) + dualScreenLeft;
        const top = (window.innerHeight / 2) - (height / 2) + dualScreenTop;
        window.open(url, '_blank', `scrollbars=yes, width=${width}, height=${height}, top=${top}, left=${left}`);
    }

    async function shareToSystem() {
        const { title, text, url } = getShareData();
        if (navigator.share) {
            try {
                await navigator.share({ title, text, url });
                closeSheet();
                return;
            } catch (e) {}
        }
        copyToClipboard();
        alert('시스템 공유를 사용할 수 없어 링크를 복사했어요.');
    }

    function shareToInstagram() {
        const { url, text } = getShareData();
        // 인스타그램은 직접 링크 공유가 제한적이므로 링크 복사로 대체
        copyToClipboard();
        alert('인스타그램 스토리에 링크를 복사했습니다. 스토리에 붙여넣기 해주세요!');
        closeSheet();
    }

    function copyToClipboard() {
        const { url } = getShareData();
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(url).then(() => {}).catch(() => {});
        } else {
            const textarea = document.createElement('textarea');
            textarea.value = url;
            textarea.style.position = 'fixed';
            textarea.style.left = '-9999px';
            document.body.appendChild(textarea);
            textarea.focus();
            textarea.select();
            try { document.execCommand('copy'); } catch (e) {}
            document.body.removeChild(textarea);
        }
    }

    function loadKakaoSDK(appKey) {
        return new Promise((resolve, reject) => {
            if (window.Kakao && window.Kakao.isInitialized && window.Kakao.isInitialized()) {
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js';
            script.crossOrigin = 'anonymous';
            script.onload = () => {
                try {
                    if (!window.Kakao.isInitialized()) {
                        window.Kakao.init(appKey);
                    }
                    resolve();
                } catch (e) { reject(e); }
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    async function shareToKakao() {
        const appKey = document.body.getAttribute('data-kakao-app-key') || '';
        const { title, text, url } = getShareData();

        if (appKey) {
            try {
                await loadKakaoSDK(appKey);
                if (window.Kakao && window.Kakao.Share) {
                    window.Kakao.Share.sendDefault({
                        objectType: 'feed',
                        content: {
                            title: title,
                            description: text,
                            imageUrl: 'https://soobo.sijun.dev/images/kitten.gif',
                            link: { mobileWebUrl: url, webUrl: url }
                        },
                        buttons: [
                            {
                                title: '자세히 보기',
                                link: { mobileWebUrl: url, webUrl: url }
                            }
                        ]
                    });
                    closeSheet();
                    return;
                }
            } catch (e) {
                // fall through to fallback
            }
        }

        if (navigator.share) {
            try {
                await navigator.share({ title, text, url });
                closeSheet();
                return;
            } catch (e) {}
        }
        copyToClipboard();
        alert('카카오톡 공유 설정이 필요합니다. 링크를 복사했어요.');
    }

    function onShareItemClick(e) {
        const target = e.target.closest('.share-item');
        if (!target) return;
        const type = target.getAttribute('data-share');
        switch (type) {
            case 'kakao':
                shareToKakao();
                break;
            case 'instagram':
                shareToInstagram();
                break;
            case 'copy':
                copyToClipboard();
                alert('링크를 복사했어요. 친구에게 공유해보세요!');
                closeSheet();
                break;
            default:
                break;
        }
    }

    shareButton.addEventListener('click', openSheet);
    cancelButton.addEventListener('click', closeSheet);
    overlay.addEventListener('click', closeSheet);
    sheet.addEventListener('click', onShareItemClick);

    // 키보드 접근성: ESC로 닫기
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sheet.classList.contains('active')) {
            closeSheet();
        }
    });
})();