const rateLimit = require('express-rate-limit');

// 일반 API용 레이트 리미터
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15분
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 요청 제한
  message: {
    success: false,
    error: '너무 많은 요청입니다. 잠시 후 다시 시도해주세요.',
    retryAfter: '15분'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // IP별로 제한
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
  }
});

// 세션 생성용 더 엄격한 레이트 리미터
const sessionCreateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5분
  max: 10, // 5분에 10개 세션만 생성 가능
  message: {
    success: false,
    error: '세션 생성 요청이 너무 많습니다. 5분 후 다시 시도해주세요.',
    retryAfter: '5분'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
  }
});

// 데이터 조회용 레이트 리미터 (관리자용)
const dataAccessLimiter = rateLimit({
  windowMs: 60 * 1000, // 1분
  max: 30, // 1분에 30개 요청
  message: {
    success: false,
    error: '데이터 조회 요청이 너무 많습니다. 1분 후 다시 시도해주세요.',
    retryAfter: '1분'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
  }
});

module.exports = {
  generalLimiter,
  sessionCreateLimiter,
  dataAccessLimiter
};
