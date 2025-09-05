const mongoose = require('mongoose');

const AnswerSchema = new mongoose.Schema(
  {
    questionId: { type: String, required: true },
    choiceId: { type: String, required: false },
    value: { type: Number, required: false },
    text: { type: String, required: false },
    answeredAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const SessionSchema = new mongoose.Schema(
  {
    sessionId: { type: String, index: true, unique: true },
    userAgent: { type: String },
    ipAddress: { type: String },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    resultType: { type: String },
    resultScores: { type: Object },
    answers: { type: [AnswerSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Session', SessionSchema);


