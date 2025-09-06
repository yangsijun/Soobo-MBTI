const express = require('express');
const Session = require('../models/Session');

const router = express.Router();

// 전체 통계 조회
router.get('/stats', async (req, res) => {
  try {
    const totalSessions = await Session.countDocuments();
    const completedSessions = await Session.countDocuments({ isCompleted: true });
    const incompleteSessions = totalSessions - completedSessions;

    // 결과 타입별 통계
    const resultStats = await Session.aggregate([
      { $match: { isCompleted: true, resultType: { $ne: null } } },
      { $group: { _id: '$resultType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // 일별 완료 세션 수 (최근 30일)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyStats = await Session.aggregate([
      { 
        $match: { 
          isCompleted: true, 
          completedAt: { $gte: thirtyDaysAgo } 
        } 
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$completedAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // 평균 응답 시간 계산 (생성부터 완료까지)
    const avgResponseTime = await Session.aggregate([
      { 
        $match: { 
          isCompleted: true, 
          completedAt: { $ne: null },
          createdAt: { $ne: null }
        } 
      },
      {
        $project: {
          responseTime: {
            $divide: [
              { $subtract: ['$completedAt', '$createdAt'] },
              1000 * 60 // 분 단위로 변환
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          avgResponseTime: { $avg: '$responseTime' }
        }
      }
    ]);

    res.json({
      success: true,
      stats: {
        totalSessions,
        completedSessions,
        incompleteSessions,
        completionRate: totalSessions > 0 ? (completedSessions / totalSessions * 100).toFixed(2) : 0,
        resultDistribution: resultStats,
        dailyCompletions: dailyStats,
        avgResponseTimeMinutes: avgResponseTime.length > 0 ? Math.round(avgResponseTime[0].avgResponseTime) : 0
      }
    });
  } catch (error) {
    console.error('통계 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '통계 조회에 실패했습니다.'
    });
  }
});

// 세션 목록 조회 (페이지네이션 지원)
router.get('/sessions', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100); // 최대 100개로 제한
    const skip = (page - 1) * limit;
    
    const filter = {};
    
    // 완료 상태 필터
    if (req.query.completed === 'true') {
      filter.isCompleted = true;
    } else if (req.query.completed === 'false') {
      filter.isCompleted = false;
    }
    
    // 결과 타입 필터
    if (req.query.resultType) {
      filter.resultType = req.query.resultType;
    }
    
    // 날짜 범위 필터
    if (req.query.startDate || req.query.endDate) {
      filter.createdAt = {};
      if (req.query.startDate) {
        filter.createdAt.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        const endDate = new Date(req.query.endDate);
        endDate.setHours(23, 59, 59, 999); // 해당 날짜 끝까지
        filter.createdAt.$lte = endDate;
      }
    }

    const sessions = await Session.find(filter)
      .select('sessionId isCompleted resultType resultScores createdAt completedAt answers')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Session.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    const sessionsWithAnswerCount = sessions.map(session => ({
      sessionId: session.sessionId,
      isCompleted: session.isCompleted,
      resultType: session.resultType,
      resultScores: session.resultScores,
      createdAt: session.createdAt,
      completedAt: session.completedAt,
      answerCount: session.answers ? session.answers.length : 0
    }));

    res.json({
      success: true,
      data: {
        sessions: sessionsWithAnswerCount,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: total,
          itemsPerPage: limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    console.error('세션 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '세션 목록 조회에 실패했습니다.'
    });
  }
});

// 특정 결과 타입의 세션들 조회
router.get('/results/:resultType', async (req, res) => {
  try {
    const { resultType } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const skip = (page - 1) * limit;

    const sessions = await Session.find({ 
      resultType, 
      isCompleted: true 
    })
      .select('sessionId resultScores createdAt completedAt answers')
      .sort({ completedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Session.countDocuments({ resultType, isCompleted: true });

    res.json({
      success: true,
      data: {
        resultType,
        sessions: sessions.map(session => ({
          sessionId: session.sessionId,
          resultScores: session.resultScores,
          createdAt: session.createdAt,
          completedAt: session.completedAt,
          answerCount: session.answers ? session.answers.length : 0
        })),
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      }
    });
  } catch (error) {
    console.error('결과별 세션 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '결과별 세션 조회에 실패했습니다.'
    });
  }
});

// 모든 세션의 응답 내용 조회 (상세 정보 포함)
router.get('/sessions/detailed', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100); // 최대 100개로 제한
    const skip = (page - 1) * limit;
    
    const filter = {};
    
    // 완료 상태 필터
    if (req.query.completed === 'true') {
      filter.isCompleted = true;
    } else if (req.query.completed === 'false') {
      filter.isCompleted = false;
    }
    
    // 결과 타입 필터
    if (req.query.resultType) {
      filter.resultType = req.query.resultType;
    }
    
    // 날짜 범위 필터
    if (req.query.startDate || req.query.endDate) {
      filter.createdAt = {};
      if (req.query.startDate) {
        filter.createdAt.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        const endDate = new Date(req.query.endDate);
        endDate.setHours(23, 59, 59, 999); // 해당 날짜 끝까지
        filter.createdAt.$lte = endDate;
      }
    }

    // 모든 세션 정보와 응답 내용을 포함하여 조회
    const sessions = await Session.find(filter)
      .select('sessionId isCompleted resultType resultScores createdAt completedAt updatedAt answers')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Session.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    // 응답 내용을 포함한 상세 정보 반환
    const sessionsWithDetails = sessions.map(session => ({
      sessionId: session.sessionId,
      isCompleted: session.isCompleted,
      resultType: session.resultType,
      resultScores: session.resultScores,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      completedAt: session.completedAt,
      totalAnswers: session.answers ? session.answers.length : 0,
      answers: session.answers || [], // 응답 내용 전체 포함
      // 응답 시간 계산 (분 단위)
      responseTimeMinutes: session.completedAt && session.createdAt 
        ? Math.round((session.completedAt - session.createdAt) / (1000 * 60))
        : null
    }));

    res.json({
      success: true,
      data: {
        sessions: sessionsWithDetails,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: total,
          itemsPerPage: limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        },
        summary: {
          totalSessions: total,
          completedSessions: sessionsWithDetails.filter(s => s.isCompleted).length,
          incompleteSessions: sessionsWithDetails.filter(s => !s.isCompleted).length
        }
      }
    });
  } catch (error) {
    console.error('상세 세션 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '상세 세션 목록 조회에 실패했습니다.'
    });
  }
});

// 답변 분석 데이터 조회
router.get('/answers/analysis', async (req, res) => {
  try {
    const questionId = req.query.questionId;
    
    if (questionId) {
      // 특정 질문의 답변 분석
      const answerDistribution = await Session.aggregate([
        { $match: { isCompleted: true } },
        { $unwind: '$answers' },
        { $match: { 'answers.questionId': questionId } },
        {
          $group: {
            _id: '$answers.choiceId',
            count: { $sum: 1 },
            avgValue: { $avg: '$answers.value' }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      res.json({
        success: true,
        data: {
          questionId,
          distribution: answerDistribution
        }
      });
    } else {
      // 전체 질문별 답변 분석
      const allAnswersAnalysis = await Session.aggregate([
        { $match: { isCompleted: true } },
        { $unwind: '$answers' },
        {
          $group: {
            _id: {
              questionId: '$answers.questionId',
              choiceId: '$answers.choiceId'
            },
            count: { $sum: 1 },
            avgValue: { $avg: '$answers.value' }
          }
        },
        {
          $group: {
            _id: '$_id.questionId',
            choices: {
              $push: {
                choiceId: '$_id.choiceId',
                count: '$count',
                avgValue: '$avgValue'
              }
            }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      res.json({
        success: true,
        data: {
          analysisType: 'all',
          questions: allAnswersAnalysis
        }
      });
    }
  } catch (error) {
    console.error('답변 분석 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '답변 분석 조회에 실패했습니다.'
    });
  }
});

module.exports = router;
