import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { storage } from '../services/storage';
import { BRAND_CONFIG } from '../config/brand';
import { QuizDefinition, QuizQuestion, QuizAttempt } from '../types';
import { MathRenderer } from './MathRenderer';
import { 
  FileCheck2, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  RotateCcw, 
  ArrowRight, 
  ArrowLeft, 
  Bookmark, 
  Award,
  AlertCircle,
  Flag,
  History
} from 'lucide-react';

interface QuizEngineProps {
  initialSubject?: string;
  initialTopic?: string;
}

export const QuizEngine: React.FC<QuizEngineProps> = ({ initialSubject, initialTopic }) => {
  const [profile, setProfile] = useState(() => storage.getUserProfile());

  // Listen for live profile updates
  useEffect(() => {
    const handleUpdate = () => {
      const p = storage.getUserProfile();
      setProfile(p);
      setGrade(p.grade);
      if (p.enrolledSubjects && p.enrolledSubjects.length > 0 && !p.enrolledSubjects.includes(subject)) {
        setSubject(p.enrolledSubjects[0]);
      }
    };
    window.addEventListener('nexora-profile-updated', handleUpdate);
    return () => window.removeEventListener('nexora-profile-updated', handleUpdate);
  }, []);

  // Generator Configuration State
  const [subject, setSubject] = useState(
    initialSubject || profile.enrolledSubjects[0] || 'Science & Technology Part 1'
  );
  const [topic, setTopic] = useState(initialTopic || 'Kepler\'s Laws of Planetary Motion (Gravitation)');
  const [grade, setGrade] = useState(profile.grade || 'Class 10 (10th Standard SSC)');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [count, setCount] = useState<number>(5);
  const [enableTimer, setEnableTimer] = useState<boolean>(true);
  const [timeMinutes, setTimeMinutes] = useState<number>(5);
  const [negativeMarking, setNegativeMarking] = useState<boolean>(false);

  // Active Quiz State
  const [activeQuiz, setActiveQuiz] = useState<QuizDefinition | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [flaggedForReview, setFlaggedForReview] = useState<Record<string, boolean>>({});
  const [remainingSeconds, setRemainingSeconds] = useState<number>(300);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [quizResult, setQuizResult] = useState<QuizAttempt | null>(null);

  // UI state
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [viewHistory, setViewHistory] = useState<boolean>(false);

  // Timer effect
  useEffect(() => {
    if (!activeQuiz || quizResult || !enableTimer) return;

    if (remainingSeconds <= 0) {
      handleSubmitQuiz();
      return;
    }

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [activeQuiz, quizResult, remainingSeconds, enableTimer]);

  const handleGenerateQuiz = async () => {
    if (!topic.trim()) {
      setErrorMessage('Please specify an academic topic or chapter name.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setQuizResult(null);

    try {
      const res = await api.generateQuiz({
        subject,
        grade,
        topic,
        difficulty,
        count,
        format: 'mcq',
      });

      if (!res.questions || !Array.isArray(res.questions) || res.questions.length === 0) {
        throw new Error('Received invalid quiz structure from server.');
      }

      const newQuiz: QuizDefinition = {
        id: 'quiz_' + Date.now(),
        title: res.quizTitle || `${topic} Assessment`,
        subject: res.subject || subject,
        topic: res.topic || topic,
        grade,
        difficulty,
        format: 'mcq',
        timeLimitSeconds: enableTimer ? timeMinutes * 60 : undefined,
        negativeMarking,
        questions: res.questions,
        createdAt: new Date().toISOString(),
      };

      setActiveQuiz(newQuiz);
      setCurrentQuestionIndex(0);
      setUserAnswers({});
      setFlaggedForReview({});
      setRemainingSeconds(timeMinutes * 60);
    } catch (err: any) {
      console.error('Quiz Generation Error:', err);
      setErrorMessage(
        err.message || 'Failed to generate quiz. Please check server status or rephrase the topic.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAnswer = (questionId: string, option: string) => {
    if (quizResult) return; // locked after submission
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: option,
    }));
  };

  const toggleFlagForReview = (questionId: string) => {
    setFlaggedForReview((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  const handleSubmitQuiz = () => {
    if (!activeQuiz || isSubmitting || quizResult) return;
    setIsSubmitting(true);

    const questions = activeQuiz.questions;
    let correctCount = 0;
    const mistakes: QuizAttempt['mistakes'] = [];

    questions.forEach((q) => {
      const userAnswer = userAnswers[q.id];
      // Normalize comparison
      const isCorrect = userAnswer && userAnswer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
      if (isCorrect) {
        correctCount++;
      } else {
        mistakes.push({
          questionId: q.id,
          question: q.question,
          userAnswer: userAnswer || 'Not Answered',
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
        });
      }
    });

    const scorePercentage = Math.round((correctCount / questions.length) * 100);
    const timeSpent = enableTimer ? (timeMinutes * 60) - Math.max(0, remainingSeconds) : 0;

    const attempt: QuizAttempt = {
      id: 'attempt_' + Date.now(),
      quizId: activeQuiz.id,
      quizTitle: activeQuiz.title,
      subject: activeQuiz.subject,
      topic: activeQuiz.topic,
      totalQuestions: questions.length,
      correctCount,
      scorePercentage,
      answers: userAnswers,
      mistakes,
      completedAt: new Date().toISOString(),
      durationSeconds: timeSpent,
      awardedXp: BRAND_CONFIG.xpRewards.quizCompleted,
    };

    storage.saveQuizAttempt(attempt);
    setQuizResult(attempt);
    setIsSubmitting(false);
  };

  const pastAttempts = storage.getQuizAttempts();

  // Render Quiz Review Results Screen
  if (quizResult && activeQuiz) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto animate-fade-in pb-12">
        {/* Score Header Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-950 border border-indigo-700/50">
            <Award className="w-8 h-8 text-amber-400" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Quiz Completed!
          </h2>
          <p className="text-sm text-slate-300 font-medium">
            {quizResult.quizTitle} ({quizResult.subject})
          </p>

          {/* Scores Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl mx-auto pt-2">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="text-xs text-slate-400">Score</div>
              <div className="text-xl font-bold font-mono text-amber-300">
                {quizResult.correctCount} / {quizResult.totalQuestions}
              </div>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="text-xs text-slate-400">Accuracy</div>
              <div className="text-xl font-bold font-mono text-emerald-400">
                {quizResult.scorePercentage}%
              </div>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="text-xs text-slate-400">Time Taken</div>
              <div className="text-xl font-bold font-mono text-indigo-300">
                {Math.floor(quizResult.durationSeconds / 60)}m {quizResult.durationSeconds % 60}s
              </div>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="text-xs text-slate-400">XP Earned</div>
              <div className="text-xl font-bold font-mono text-violet-400">
                +{BRAND_CONFIG.xpRewards.quizCompleted} XP
              </div>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => {
                setActiveQuiz(null);
                setQuizResult(null);
              }}
              className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-semibold shadow-md transition-colors cursor-pointer"
            >
              Generate New Quiz
            </button>
            <button
              onClick={() => {
                // Retry same questions
                setUserAnswers({});
                setFlaggedForReview({});
                setRemainingSeconds(timeMinutes * 60);
                setQuizResult(null);
                setCurrentQuestionIndex(0);
              }}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 rounded-xl text-xs font-medium transition-colors cursor-pointer"
            >
              Retry Same Questions
            </button>
          </div>
        </div>

        {/* Detailed Mistake & Question Review */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white">Question by Question Review</h3>
          <div className="space-y-4">
            {activeQuiz.questions.map((q, idx) => {
              const userAns = quizResult.answers[q.id];
              const isCorrect = userAns && userAns.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();

              return (
                <div
                  key={q.id}
                  className={`p-5 rounded-2xl border space-y-3 ${
                    isCorrect
                      ? 'bg-slate-900/60 border-emerald-900/40'
                      : 'bg-slate-900/90 border-rose-900/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-xs font-mono text-slate-400">Question {idx + 1}</span>
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                        isCorrect
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}
                    >
                      {isCorrect ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Correct</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Incorrect</span>
                        </>
                      )}
                    </span>
                  </div>

                  <div className="text-sm sm:text-base font-medium text-white">
                    <MathRenderer content={q.question} />
                  </div>

                  {/* Options review */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {q.options.map((opt, oIdx) => {
                      const isUserSelection = userAns === opt;
                      const isActualCorrect = opt.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();

                      let stateStyle = 'bg-slate-950/70 border-slate-800 text-slate-300';
                      if (isActualCorrect) {
                        stateStyle = 'bg-emerald-950/60 border-emerald-500/80 text-emerald-200 font-semibold';
                      } else if (isUserSelection && !isCorrect) {
                        stateStyle = 'bg-rose-950/60 border-rose-500/80 text-rose-200';
                      }

                      return (
                        <div key={oIdx} className={`p-3 rounded-lg border ${stateStyle}`}>
                          <MathRenderer content={opt} />
                          {isUserSelection && (
                            <span className="block text-[10px] text-slate-400 mt-1">Your response</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation */}
                  <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl text-xs space-y-1">
                    <span className="font-semibold text-amber-300">Explanation:</span>
                    <MathRenderer content={q.explanation} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Active Quiz View (While Taking Quiz)
  if (activeQuiz) {
    const q = activeQuiz.questions[currentQuestionIndex];
    const isAnswered = Boolean(userAnswers[q.id]);
    const isFlagged = Boolean(flaggedForReview[q.id]);

    const formatTimer = (secs: number) => {
      const m = Math.floor(secs / 60);
      const s = secs % 60;
      return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return (
      <div className="space-y-6 max-w-3xl mx-auto animate-fade-in pb-12">
        {/* Top Quiz Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white truncate max-w-xs sm:max-w-md">
              {activeQuiz.title}
            </h2>
            <div className="text-xs text-slate-400">
              {activeQuiz.subject} · {activeQuiz.difficulty.toUpperCase()}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {enableTimer && (
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs font-semibold ${
                  remainingSeconds < 60
                    ? 'bg-rose-950 border border-rose-700 text-rose-300 animate-pulse'
                    : 'bg-slate-950 border border-slate-800 text-indigo-300'
                }`}
              >
                <Clock className="w-4 h-4 text-indigo-400" />
                <span>{formatTimer(remainingSeconds)}</span>
              </div>
            )}

            <button
              onClick={handleSubmitQuiz}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              Submit Quiz
            </button>
          </div>
        </div>

        {/* Question Navigator Dots */}
        <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400 mr-2">Questions:</span>
          {activeQuiz.questions.map((item, idx) => {
            const answered = Boolean(userAnswers[item.id]);
            const isCurrent = idx === currentQuestionIndex;
            const flagged = Boolean(flaggedForReview[item.id]);

            let dotStyle = 'bg-slate-950 border-slate-800 text-slate-400';
            if (isCurrent) dotStyle = 'bg-violet-600 border-violet-500 text-white shadow-md';
            else if (flagged) dotStyle = 'bg-amber-950 border-amber-600 text-amber-300';
            else if (answered) dotStyle = 'bg-indigo-950 border-indigo-700 text-indigo-300';

            return (
              <button
                key={item.id}
                onClick={() => setCurrentQuestionIndex(idx)}
                className={`w-7 h-7 rounded-lg text-xs font-mono font-medium border flex items-center justify-center transition-all cursor-pointer ${dotStyle}`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        {/* Current Question Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-mono">
              Question {currentQuestionIndex + 1} of {activeQuiz.questions.length}
            </span>
            <button
              onClick={() => toggleFlagForReview(q.id)}
              className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
                isFlagged ? 'text-amber-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Flag className="w-3.5 h-3.5" />
              <span>{isFlagged ? 'Flagged for Review' : 'Mark for Review'}</span>
            </button>
          </div>

          <div className="text-base sm:text-lg font-medium text-white leading-relaxed">
            <MathRenderer content={q.question} />
          </div>

          {/* Options */}
          <div className="space-y-3 pt-2">
            {q.options.map((opt, oIdx) => {
              const isSelected = userAnswers[q.id] === opt;
              return (
                <button
                  key={oIdx}
                  type="button"
                  onClick={() => handleSelectAnswer(q.id, opt)}
                  className={`w-full p-4 rounded-xl text-left text-sm border transition-all flex items-start gap-3 cursor-pointer ${
                    isSelected
                      ? 'bg-violet-950/70 border-violet-500 text-white shadow-sm'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 text-slate-200'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'border-violet-500 bg-violet-600 text-white'
                        : 'border-slate-700 bg-slate-900'
                    }`}
                  >
                    {isSelected && <span className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <div className="flex-1">
                    <MathRenderer content={opt} />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              disabled={currentQuestionIndex === 0}
              onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-xs text-slate-300 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            {currentQuestionIndex < activeQuiz.questions.length - 1 ? (
              <button
                onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              >
                <span>Next Question</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={handleSubmitQuiz}
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Submit Quiz Now</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Quiz Generator Config / Past Attempts Home Screen
  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in pb-12">
      {/* Header & Mode Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <FileCheck2 className="w-6 h-6 text-indigo-400" />
            <span>AI Quiz Generator & Mock Engine</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Generate topic-targeted academic assessments with verified answer keys, timer controls, and detailed explanations.
          </p>
        </div>

        <button
          onClick={() => setViewHistory(!viewHistory)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white cursor-pointer"
        >
          <History className="w-4 h-4 text-amber-400" />
          <span>{viewHistory ? 'Generator Form' : `Past Attempts (${pastAttempts.length})`}</span>
        </button>
      </div>

      {viewHistory ? (
        /* Past Attempts List */
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-white">Your Past Quiz Attempts</h2>
          {pastAttempts.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
              <p className="text-sm text-slate-400">No quizzes completed yet.</p>
              <button
                onClick={() => setViewHistory(false)}
                className="px-4 py-2 bg-indigo-600 text-white text-xs rounded-lg font-medium"
              >
                Generate First Quiz
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {pastAttempts.map((att) => (
                <div
                  key={att.id}
                  className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-semibold text-white">{att.subject}</span>
                      <span className="text-slate-600">·</span>
                      <span className="text-slate-400">{att.topic}</span>
                    </div>
                    <div className="text-xs text-slate-400">
                      Completed {new Date(att.completedAt).toLocaleDateString()} · {att.totalQuestions} questions
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-bold font-mono text-emerald-400">{att.scorePercentage}%</div>
                      <div className="text-[11px] text-slate-400">{att.correctCount}/{att.totalQuestions} correct</div>
                    </div>
                    <span className="text-xs font-mono text-amber-400 bg-amber-400/10 px-2 py-1 rounded">
                      +{att.awardedXp} XP
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Generator Form */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Subject */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Subject
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                {BRAND_CONFIG.subjects.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Academic Grade */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Grade / Exam Level
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                {BRAND_CONFIG.grades.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            {/* Topic or Chapter */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Chapter / Specific Topic
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Kepler's Laws, Optics, Organic Hydrocarbons, Quadratic Equations..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Difficulty
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['easy', 'medium', 'hard'] as const).map((diff) => (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => setDifficulty(diff)}
                    className={`py-2 rounded-lg text-xs font-medium uppercase border transition-colors cursor-pointer ${
                      difficulty === diff
                        ? 'bg-indigo-950 border-indigo-500 text-indigo-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>

            {/* Question Count */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Question Count ({count} Questions)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[3, 5, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setCount(num)}
                    className={`py-2 rounded-lg text-xs font-mono font-medium border transition-colors cursor-pointer ${
                      count === num
                        ? 'bg-indigo-950 border-indigo-500 text-indigo-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {num} Qs
                  </button>
                ))}
              </div>
            </div>

            {/* Timer Config */}
            <div className="flex items-center gap-3 p-3 bg-slate-950 border border-slate-800 rounded-lg">
              <input
                type="checkbox"
                id="timerToggle"
                checked={enableTimer}
                onChange={(e) => setEnableTimer(e.target.checked)}
                className="rounded accent-indigo-500 cursor-pointer"
              />
              <label htmlFor="timerToggle" className="text-xs text-slate-300 cursor-pointer">
                Timed Examination Mode ({timeMinutes} min)
              </label>
            </div>

            {/* Negative Marking */}
            <div className="flex items-center gap-3 p-3 bg-slate-950 border border-slate-800 rounded-lg">
              <input
                type="checkbox"
                id="negativeMarking"
                checked={negativeMarking}
                onChange={(e) => setNegativeMarking(e.target.checked)}
                className="rounded accent-indigo-500 cursor-pointer"
              />
              <label htmlFor="negativeMarking" className="text-xs text-slate-300 cursor-pointer">
                Negative Marking (-0.25 on wrong answers)
              </label>
            </div>
          </div>

          {errorMessage && (
            <div className="p-4 bg-rose-950/60 border border-rose-800 rounded-xl flex items-center gap-2 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              onClick={handleGenerateQuiz}
              disabled={loading}
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white font-medium text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin text-amber-300" />
                  <span>Synthesizing Academic Quiz Questions...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Generate Quiz & Start</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
