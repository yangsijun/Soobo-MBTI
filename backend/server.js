require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/database');
const { generalLimiter, sessionCreateLimiter, dataAccessLimiter } = require('./middleware/rateLimiter');

// 라우터 import
const sessionsRouter = require('./routes/sessions');
const dataRouter = require('./routes/data');

const app = express();
const PORT = process.env.PORT || 4000;

// 데이터베이스 연결
connectDB();

// 미들웨어 설정
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false // API 서버이므로 CSP 비활성화
}));

// CORS 설정
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['https://soobo.sijun.dev'];

app.use(cors({
  origin: function (origin, callback) {
    // origin이 없는 경우 (같은 도메인) 허용
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('CORS 정책에 의해 허용되지 않는 origin입니다.'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// 로깅 미들웨어
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// JSON 파싱 미들웨어
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 기본 레이트 리미터 적용
app.use('/api', generalLimiter);

// 라우터 설정
app.use('/api/sessions', sessionsRouter);
app.use('/api/data', dataAccessLimiter, dataRouter);

// 세션 생성에만 더 엄격한 레이트 리미터 적용
// app.use('/api/sessions', sessionCreateLimiter);

// Health check 엔드포인트
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 기본 라우트
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Soobo MBTI Backend API',
    version: '1.0.0',
    endpoints: {
      sessions: '/api/sessions',
      data: '/api/data',
      health: '/health'
    }
  });
});

// 404 에러 핸들러
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: '요청하신 엔드포인트를 찾을 수 없습니다.',
    path: req.originalUrl
  });
});

// 글로벌 에러 핸들러
app.use((err, req, res, next) => {
  console.error('글로벌 에러:', err);
  
  // CORS 에러
  if (err.message.includes('CORS')) {
    return res.status(403).json({
      success: false,
      error: 'CORS 정책 위반'
    });
  }

  // MongoDB 에러
  if (err.name === 'MongoError' || err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: '데이터베이스 오류가 발생했습니다.'
    });
  }

  // JSON 파싱 에러
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      error: '잘못된 JSON 형식입니다.'
    });
  }

  // 기본 서버 에러
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? '서버 내부 오류가 발생했습니다.' 
      : err.message
  });
});

// 우아한 종료 처리
process.on('SIGTERM', () => {
  console.log('🔄 SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🔄 SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 CORS allowed origins: ${allowedOrigins.join(', ')}`);
});
