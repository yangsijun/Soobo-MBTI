const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionId: {
    type: String,
    required: true
  },
  choiceId: {
    type: String,
    required: true
  },
  value: {
    type: Number,
    required: true
  },
  answeredAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const sessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  answers: [answerSchema],
  resultType: {
    type: String,
    default: null
  },
  resultScores: {
    morning: String,
    control: String,
    rhythm: String,
    recovery: String
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// 인덱스 설정
sessionSchema.index({ createdAt: -1 });
sessionSchema.index({ isCompleted: 1 });
sessionSchema.index({ resultType: 1 });

module.exports = mongoose.model('Session', sessionSchema);
