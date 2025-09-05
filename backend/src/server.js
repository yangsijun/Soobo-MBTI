require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');

const { connectToDatabase } = require('./config/db');
const sessionsRouter = require('./routes/sessions');

const app = express();

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
  res.json({ status: 'ok' });
});

app.use('/api/sessions', sessionsRouter);

const PORT = process.env.PORT || 4000;
connectToDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`API server listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  });

module.exports = app;


