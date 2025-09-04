// 수면 MBTI 점수 계산 로직
class SleepMBTICalculator {
    constructor() {
        this.answers = {};
    }

    // 답변 저장
    setAnswer(questionIndex, answerIndex) {
        this.answers[questionIndex] = answerIndex;
    }

    // 1. 아침형 vs 야행형 계산
    calculateMorningVsNight() {
        const q4Score = this.getMorningScore(3); // 에너지 피크 시간 (Q4는 인덱스 3)
        const q5Score = this.getMorningScore(4); // 평일 기상 시간 (Q5는 인덱스 4)
        const q9Score = this.getMorningScore(8); // 취침 시간 (Q9는 인덱스 8)
        const q10Score = this.getMorningScore(9); // 기상 시간 (Q10은 인덱스 9)
        const q11Score = this.getMorningScore(10); // 주말 기상 시간 (Q11은 인덱스 10)
        
        const morningScore = (q4Score + q5Score + q9Score + q10Score + q11Score) / 5;
        return morningScore >= 0.5 ? 'morning' : 'night';
    }

    // 2. 통제형 vs 자유형 계산
    calculateControlledVsFree() {
        const q1Score = this.getControlScore(0); // 취침 준비 (Q1은 인덱스 0)
        const q2Score = this.getControlScore(1); // 잠들기 속도 (Q2는 인덱스 1)
        const q3Score = this.getControlScore(2); // 늦게 자는 이유 (Q3은 인덱스 2)
        
        const controlScore = (q1Score + q2Score + q3Score) / 3;
        return controlScore >= 0.5 ? 'controlled' : 'free';
    }

    // 3. 리듬형 vs 시차형 계산
    calculateRhythmicVsJetlag() {
        const q6Score = this.getRhythmScore(5); // 알람 필요 여부 (Q6은 인덱스 5)
        const q12Score = this.getRhythmScore(11); // 주중/주말 차이 (Q12는 인덱스 11)
        
        const rhythmScore = (q6Score + q12Score) / 2;
        return rhythmScore >= 0.5 ? 'rhythmic' : 'jetlag';
    }

    // 4. 충분 회복형 vs 불만족형 계산
    calculateWellRestedVsDeprived() {
        const q8Score = this.getRecoveryScore(7); // 이상적 수면시간 (Q8은 인덱스 7)
        const q13Score = this.getRecoveryScore(12); // 수면 만족도 (Q13은 인덱스 12)
        const q14Score = this.getRecoveryScore(13); // 낮잠 습관 (Q14은 인덱스 13)
        
        const recoveryScore = (q8Score + q13Score + q14Score) / 3;
        return recoveryScore >= 0.5 ? 'well-rested' : 'deprived';
    }

    // 아침형 점수 계산
    getMorningScore(questionIndex) {
        const answerIndex = this.answers[questionIndex];
        if (answerIndex === undefined) return 0;
        
        switch(questionIndex) {
            case 3: // 에너지 피크 시간 (Q4)
                return answerIndex <= 1 ? 1 : 0; // 이른 아침, 오전-점심 = 1
            case 4: // 평일 기상 시간 (Q5)
                return answerIndex <= 1 ? 1 : 0; // 11시 전, 11-12시 = 1
            case 8: // 취침 시간 (Q9)
                return answerIndex <= 1 ? 1 : 0; // 11시 전, 11-12시 = 1
            case 9: // 기상 시간 (Q10)
                return answerIndex <= 1 ? 1 : 0; // 07시 전, 07-08시 = 1
            case 10: // 주말 기상 시간 (Q11)
                return answerIndex <= 1 ? 1 : 0; // 규칙적, 1-2시간 차이 = 1
            default:
                return 0;
        }
    }

    // 통제형 점수 계산
    getControlScore(questionIndex) {
        const answerIndex = this.answers[questionIndex];
        if (answerIndex === undefined) return 0;
        
        switch(questionIndex) {
            case 0: // 취침 준비 (Q1)
                return answerIndex === 0 ? 1 : 0; // 바로 꿈나라 = 1
            case 1: // 잠들기 속도 (Q2)
                return answerIndex <= 1 ? 1 : 0; // 5분-20분 = 1
            case 2: // 늦게 자는 이유 (Q3)
                return answerIndex >= 1 ? 1 : 0; // 새벽 집중력, 기타 = 1
            default:
                return 0;
        }
    }

    // 리듬형 점수 계산
    getRhythmScore(questionIndex) {
        const answerIndex = this.answers[questionIndex];
        if (answerIndex === undefined) return 0;
        
        switch(questionIndex) {
            case 5: // 알람 필요 여부 (Q6)
                return answerIndex === 0 ? 1 : 0; // 늘 가능 = 1
            case 11: // 주중/주말 차이 (Q12)
                return answerIndex <= 1 ? 1 : 0; // 차이 없음, 1-2시간 = 1
            default:
                return 0;
        }
    }

    // 충분 회복형 점수 계산
    getRecoveryScore(questionIndex) {
        const answerIndex = this.answers[questionIndex];
        if (answerIndex === undefined) return 0;
        
        switch(questionIndex) {
            case 7: // 이상적 수면시간 (Q8)
                return answerIndex >= 2 ? 1 : 0; // 7-9시간, 9시간 이상 = 1
            case 12: // 수면 만족도 (Q13)
                return answerIndex <= 1 ? 1 : 0; // 매우 만족, 적당히 만족 = 1
            case 13: // 낮잠 습관 (Q14)
                return answerIndex <= 1 ? 1 : 0; // 안 잔다, 가끔 20-30분 = 1
            default:
                return 0;
        }
    }

    // 최종 결과 계산
    calculateFinalResult() {
        const morning = this.calculateMorningVsNight();
        const control = this.calculateControlledVsFree();
        const rhythm = this.calculateRhythmicVsJetlag();
        const recovery = this.calculateWellRestedVsDeprived();
        
        return {
            morning,
            control,
            rhythm,
            recovery,
            type: this.getSleepType(morning, control, rhythm, recovery)
        };
    }

    // 수면 유형 결정
    getSleepType(morning, control, rhythm, recovery) {
        const typeMap = {
            'morning-controlled-rhythmic-well-rested': '🌞 아침 햇살 장인 (ENTJ)',
            'morning-controlled-rhythmic-deprived': '⏰ 졸린 알람 파이터 (ISFJ)',
            'morning-controlled-jetlag-well-rested': '🛫 출근 모드 마스터 (ENTJ)',
            'morning-controlled-jetlag-deprived': '🥱 억지 부지런러 (ISFJ)',
        
            'morning-free-rhythmic-well-rested': '🐦 아침 산책러 (ISFP)',
            'morning-free-rhythmic-deprived': '😵 아침 비틀이 (ENFP)',
            'morning-free-jetlag-well-rested': '🌍 글로벌 얼리버드 (ESFP)',
            'morning-free-jetlag-deprived': '🙃 아침 좀비형 (ENFP)',
        
            'night-controlled-rhythmic-well-rested': '🌙 달빛 워커홀릭 (ESTP)',
            'night-controlled-rhythmic-deprived': '💼 야근형 부스터 (ESTP)',
            'night-controlled-jetlag-well-rested': '🛰️ 밤의 글로벌러 (ENTJ)',
            'night-controlled-jetlag-deprived': '😵‍💫 늦밤 생존러 (ISFJ)',
        
            'night-free-rhythmic-well-rested': '🦉 새벽 감성러 (INFJ)',
            'night-free-rhythmic-deprived': '🥴 새벽 후회러 (ENFP)',
            'night-free-jetlag-well-rested': '🎨 밤의 크리에이터 (INTP)',
            'night-free-jetlag-deprived': '🔥 새벽 방황러 (ENFP)'
        };
        
        const key = `${morning}-${control}-${rhythm}-${recovery}`;
        return typeMap[key] || '수면 MBTI';
    }
}
