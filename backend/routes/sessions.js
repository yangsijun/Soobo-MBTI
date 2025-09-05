const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Session = require('../models/Session');

const router = express.Router();

// 새 세션 생성
router.post('/', async (req, res) => {
  try {
    const sessionId = uuidv4();
    
    const session = new Session({
      sessionId,
      answers: [],
      isCompleted: false
    });

    await session.save();
    
    res.status(201).json({
      success: true,
      sessionId,
      message: '세션이 생성되었습니다.'
    });
  } catch (error) {
    console.error('세션 생성 오류:', error);
    res.status(500).json({
      success: false,
      error: '세션 생성에 실패했습니다.'
    });
  }
});

// 답변 저장/업데이트
router.put('/:sessionId/answers', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { answers } = req.body;

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        error: '올바른 답변 데이터가 필요합니다.'
      });
    }

    const session = await Session.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({
        success: false,
        error: '세션을 찾을 수 없습니다.'
      });
    }

    if (session.isCompleted) {
      return res.status(400).json({
        success: false,
        error: '이미 완료된 세션입니다.'
      });
    }

    // 기존 답변들과 새 답변들을 병합
    const existingAnswers = session.answers || [];
    const newAnswers = [...answers];

    // 중복 제거 및 병합 (questionId 기준으로 최신 답변 유지)
    const answerMap = new Map();
    
    // 기존 답변들을 먼저 추가
    existingAnswers.forEach(answer => {
      answerMap.set(answer.questionId, answer);
    });
    
    // 새 답변들로 업데이트 (덮어쓰기)
    newAnswers.forEach(answer => {
      answerMap.set(answer.questionId, {
        questionId: answer.questionId,
        choiceId: answer.choiceId,
        value: answer.value,
        answeredAt: answer.answeredAt || new Date()
      });
    });

    session.answers = Array.from(answerMap.values());
    session.updatedAt = new Date();
    
    await session.save();

    res.json({
      success: true,
      message: '답변이 저장되었습니다.',
      totalAnswers: session.answers.length
    });
  } catch (error) {
    console.error('답변 저장 오류:', error);
    res.status(500).json({
      success: false,
      error: '답변 저장에 실패했습니다.'
    });
  }
});

// 세션 완료
router.post('/:sessionId/complete', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { resultType, resultScores, answers } = req.body;

    const session = await Session.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({
        success: false,
        error: '세션을 찾을 수 없습니다.'
      });
    }

    if (session.isCompleted) {
      return res.status(400).json({
        success: false,
        error: '이미 완료된 세션입니다.'
      });
    }

    // 최종 답변이 있으면 업데이트
    if (answers && Array.isArray(answers)) {
      const answerMap = new Map();
      
      // 기존 답변들을 먼저 추가
      (session.answers || []).forEach(answer => {
        answerMap.set(answer.questionId, answer);
      });
      
      // 최종 답변들로 업데이트
      answers.forEach(answer => {
        answerMap.set(answer.questionId, {
          questionId: answer.questionId,
          choiceId: answer.choiceId,
          value: answer.value,
          answeredAt: answer.answeredAt || new Date()
        });
      });

      session.answers = Array.from(answerMap.values());
    }

    // 결과 저장
    session.resultType = resultType;
    session.resultScores = resultScores;
    session.isCompleted = true;
    session.completedAt = new Date();
    session.updatedAt = new Date();

    await session.save();

    res.json({
      success: true,
      message: '세션이 완료되었습니다.',
      sessionId,
      resultType,
      totalAnswers: session.answers.length
    });
  } catch (error) {
    console.error('세션 완료 오류:', error);
    res.status(500).json({
      success: false,
      error: '세션 완료에 실패했습니다.'
    });
  }
});

// 세션 정보 조회
router.get('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = await Session.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({
        success: false,
        error: '세션을 찾을 수 없습니다.'
      });
    }

    res.json({
      success: true,
      session: {
        sessionId: session.sessionId,
        answers: session.answers,
        resultType: session.resultType,
        resultScores: session.resultScores,
        isCompleted: session.isCompleted,
        createdAt: session.createdAt,
        completedAt: session.completedAt,
        totalAnswers: session.answers ? session.answers.length : 0
      }
    });
  } catch (error) {
    console.error('세션 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '세션 조회에 실패했습니다.'
    });
  }
});

module.exports = router;
