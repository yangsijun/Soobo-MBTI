const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Session = require('../models/Session');

const router = express.Router();

// Start a new session
router.post('/', async (req, res) => {
  try {
    const sessionId = uuidv4();
    const session = await Session.create({
      sessionId,
      userAgent: req.get('user-agent'),
      ipAddress: req.ip,
    });
    res.status(201).json({ sessionId, id: session._id });
  } catch (error) {
    res.status(500).json({ message: 'Failed to start session', error: error.message });
  }
});

// Upsert answers in bulk
router.put('/:sessionId/answers', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { answers } = req.body || {};
    if (!Array.isArray(answers)) {
      return res.status(400).json({ message: 'answers must be an array' });
    }
    const session = await Session.findOneAndUpdate(
      { sessionId },
      { $set: { answers } },
      { upsert: true, new: true }
    );
    res.json({ sessionId: session.sessionId, answers: session.answers });
  } catch (error) {
    res.status(500).json({ message: 'Failed to save answers', error: error.message });
  }
});

// Complete session with final result (and optional answers)
router.post('/:sessionId/complete', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { resultType, resultScores, answers } = req.body || {};
    if (!resultType) {
      return res.status(400).json({ message: 'resultType is required' });
    }

    const update = {
      resultType,
      resultScores: resultScores || undefined,
      completedAt: new Date(),
    };
    if (Array.isArray(answers)) {
      update.answers = answers;
    }

    const session = await Session.findOneAndUpdate(
      { sessionId },
      { $set: update },
      { upsert: true, new: true }
    );
    res.json({ sessionId: session.sessionId, completedAt: session.completedAt, resultType: session.resultType });
  } catch (error) {
    res.status(500).json({ message: 'Failed to complete session', error: error.message });
  }
});

// Get session summary
router.get('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await Session.findOne({ sessionId }).lean();
    if (!session) return res.status(404).json({ message: 'Session not found' });
    res.json(session);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get session', error: error.message });
  }
});

module.exports = router;


