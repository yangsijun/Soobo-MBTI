require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');

const { connectToDatabase } = require('./config/db');
const sessionsRouter = require('./routes/sessions');

const app = express();
let dbStatus = { connected: false, error: null };

app.use(helmet());
const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({ origin: (origin, cb) => {
  if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
    return cb(null, true);
  }
  return cb(new Error('Not allowed by CORS'));
}, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));
app.disable('x-powered-by');

app.get('/health', (req, res) => {
  res.json({ status: 'ok', db: dbStatus });
});

// Proxy 경로(`/api`) 하에서도 헬스체크 가능하도록 추가
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', db: dbStatus });
});

app.use('/api/sessions', sessionsRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API server listening on port ${PORT}`);
});

// Connect to DB in the background (non-blocking)
connectToDatabase()
  .then((conn) => {
    dbStatus.connected = true;
    dbStatus.error = null;
    dbStatus.name = conn && conn.name;
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    dbStatus.connected = false;
    dbStatus.error = err && err.message ? err.message : String(err);
    console.error('Failed to connect to MongoDB (non-blocking)', err);
  });

module.exports = app;


