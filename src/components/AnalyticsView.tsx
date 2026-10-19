import React, { useState } from 'react';
import { storage } from '../services/storage';
import { BRAND_CONFIG } from '../config/brand';
import { 
  BarChart2, 
  Award, 
  Flame, 
  Clock, 
  CheckCircle2, 
  Printer, 
  AlertTriangle, 
  Calendar,
  Layers,
  Sparkles,
  TrendingUp,
  FileCheck2
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const AnalyticsView: React.FC = () => {
  const [profile, setProfile] = useState(() => storage.getUserProfile());
  const levelInfo = storage.getUserLevelInfo();
  const streakInfo = storage.getStreakInfo();
  const quizAttempts = storage.getQuizAttempts();
  const weakTopics = storage.getWeakTopics();
  const weeklyActivity = storage.getWeeklyActivity();
  const xpTransactions = storage.getXpTransactions();

  // Listen for live profile updates
  React.useEffect(() => {
    const handleUpdate = () => {
      setProfile(storage.getUserProfile());
    };
    window.addEventListener('nexora-profile-updated', handleUpdate);
    return () => window.removeEventListener('nexora-profile-updated', handleUpdate);
  }, []);

  // Print scorecard handler
  const handlePrintScorecard = () => {
    window.print();
  };

  const accuracyData = quizAttempts.map((q, idx) => ({
    name: `Q${quizAttempts.length - idx}`,
    accuracy: q.scorePercentage,
    topic: q.topic,
  })).reverse();

  // Subject wise distribution
  const subjectDistribution: Record<string, { total: number; correct: number }> = {};
  quizAttempts.forEach((q) => {
    if (!subjectDistribution[q.subject]) {
      subjectDistribution[q.subject] = { total: 0, correct: 0 };
    }
    subjectDistribution[q.subject].total += q.totalQuestions;
    subjectDistribution[q.subject].correct += q.correctCount;
  });

  const subjectData = Object.entries(subjectDistribution).map(([subj, data]) => ({
    subject: subj,
    accuracy: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
    questions: data.total,
  }));

  // Verified achievements list
  const achievements = [
    {
      id: 'first_quiz',
      title: 'First Step',
      desc: 'Complete your first practice quiz',
      earned: quizAttempts.length >= 1,
    },
    {
      id: 'streak_3',
      title: 'Consistent Learner',
      desc: 'Maintain a 3-day study streak',
      earned: streakInfo.currentStreak >= 3 || streakInfo.longestStreak >= 3,
    },
    {
      id: 'scholar_xp',
      title: 'Scholar Initiate',
      desc: 'Earn over 100 verified XP',
      earned: levelInfo.totalXp >= 100,
    },
    {
      id: 'accuracy_ace',
      title: 'Accuracy Ace',
      desc: 'Score 80%+ on any academic quiz',
      earned: quizAttempts.some((q) => q.scorePercentage >= 80),
    },
    {
      id: 'deep_focus',
      title: 'Focus Marathon',
      desc: 'Log at least 60 minutes of study focus',
      earned: storage.getStudySessions().reduce((acc, s) => acc + s.durationMinutes, 0) >= 60,
    },
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-fade-in pb-12 print:text-black print:bg-white">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-violet-400" />
            <span>Learning Analytics & Verified Student Scorecard</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Real performance records aggregated from verified quiz submissions and focus sessions.
          </p>
        </div>

        <button
          onClick={handlePrintScorecard}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
        >
          <Printer className="w-4 h-4 text-amber-400" />
          <span>Print / Export Scorecard</span>
        </button>
      </div>

      {/* Official Student Scorecard Printable Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl print:border-black print:p-4 print:shadow-none">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 print:border-black pb-4">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-amber-400 print:text-black">
              Official Learner Scorecard
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-white print:text-black mt-1">
              {profile.name}
            </h2>
            <div className="text-xs text-slate-400 print:text-gray-700 flex flex-wrap items-center gap-2 mt-1">
              <span>{profile.grade}</span>
              <span>·</span>
              <span>{profile.board}</span>
              <span>·</span>
              <span>{profile.examination || 'Class 10 SSC Board Examination'}</span>
              <span>·</span>
              <span>Exam Date: {profile.targetExamDate === '2027-02-15' ? '15 February 2027' : profile.targetExamDate}</span>
              <span>·</span>
              <span>Target: {profile.targetMarksPercentage}%</span>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs uppercase font-mono text-violet-400 print:text-black">Current Rank</div>
            <div className="text-lg font-bold text-white print:text-black">
              Level {levelInfo.currentLevel} ({levelInfo.title})
            </div>
            <div className="text-xs font-mono text-amber-400 print:text-black mt-0.5">
              {levelInfo.totalXp} Verified XP
            </div>
          </div>
        </div>

        {/* Real Summary Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3 bg-slate-950 print:bg-gray-100 rounded-xl border border-slate-800 print:border-gray-300">
            <div className="text-[11px] text-slate-400 print:text-gray-700">Daily Study Streak</div>
            <div className="text-xl font-bold font-mono text-amber-400 print:text-black mt-0.5">
              {streakInfo.currentStreak} Days
            </div>
          </div>
          <div className="p-3 bg-slate-950 print:bg-gray-100 rounded-xl border border-slate-800 print:border-gray-300">
            <div className="text-[11px] text-slate-400 print:text-gray-700">Quizzes Completed</div>
            <div className="text-xl font-bold font-mono text-indigo-400 print:text-black mt-0.5">
              {quizAttempts.length}
            </div>
          </div>
          <div className="p-3 bg-slate-950 print:bg-gray-100 rounded-xl border border-slate-800 print:border-gray-300">
            <div className="text-[11px] text-slate-400 print:text-gray-700">Average Quiz Accuracy</div>
            <div className="text-xl font-bold font-mono text-emerald-400 print:text-black mt-0.5">
              {quizAttempts.length > 0
                ? `${Math.round(quizAttempts.reduce((sum, q) => sum + q.scorePercentage, 0) / quizAttempts.length)}%`
                : '—'}
            </div>
          </div>
          <div className="p-3 bg-slate-950 print:bg-gray-100 rounded-xl border border-slate-800 print:border-gray-300">
            <div className="text-[11px] text-slate-400 print:text-gray-700">Total Focus Time</div>
            <div className="text-xl font-bold font-mono text-violet-400 print:text-black mt-0.5">
              {storage.getStudySessions().reduce((sum, s) => sum + s.durationMinutes, 0)} min
            </div>
          </div>
        </div>

        <div className="text-[10px] text-slate-500 print:text-gray-600 italic">
          Disclaimer: Gamification XP represents verified learning engagement and practice consistency, not official board examination marks.
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:hidden">
        {/* Quiz Accuracy Over Time */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Quiz Accuracy Trend (%)</span>
            </span>
            <span className="text-slate-400 text-[11px]">Chronological</span>
          </div>

          <div className="h-48 w-full">
            {accuracyData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                Complete at least 1 quiz to plot accuracy trend.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={accuracyData}>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#1e293b',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [`${val}%`, 'Accuracy']}
                  />
                  <Line type="monotone" dataKey="accuracy" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Subject-Wise Performance */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <FileCheck2 className="w-4 h-4 text-indigo-400" />
              <span>Subject Performance & Question Volume</span>
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {subjectData.length === 0 ? (
              <div className="h-44 flex items-center justify-center text-xs text-slate-500">
                No subject records logged yet.
              </div>
            ) : (
              subjectData.map((s, idx) => (
                <div key={idx} className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span className="font-medium">{s.subject} ({s.questions} Qs)</span>
                    <span className="font-mono text-emerald-400 font-semibold">{s.accuracy}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500"
                      style={{ width: `${s.accuracy}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Verified Achievements & Milestones */}
      <div className="space-y-4 print:hidden">
        <h2 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-400" />
          <span>Verified Academic Achievements</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {achievements.map((ach) => (
            <div
              key={ach.id}
              className={`p-4 rounded-xl border transition-all flex items-start gap-3 ${
                ach.earned
                  ? 'bg-slate-900/90 border-amber-500/40'
                  : 'bg-slate-950/40 border-slate-800/60 opacity-40'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  ach.earned
                    ? 'bg-amber-950/80 border border-amber-600/60 text-amber-300'
                    : 'bg-slate-900 border border-slate-800 text-slate-600'
                }`}
              >
                <Award className="w-5 h-5" />
              </div>

              <div className="space-y-0.5">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>{ach.title}</span>
                  {ach.earned && (
                    <span className="text-[10px] text-amber-400 font-mono">· Unlocked</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">{ach.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* XP Transactions Ledger */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 print:hidden">
        <div className="flex items-center justify-between">
          <h2 className="text-sm sm:text-base font-semibold text-white">
            Verified XP Ledger (Anti-Abuse Log)
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            Total Transactions: {xpTransactions.length}
          </span>
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto">
          {xpTransactions.slice().reverse().map((tx) => (
            <div
              key={tx.id}
              className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs"
            >
              <div className="space-y-0.5">
                <div className="font-medium text-slate-200">{tx.description}</div>
                <div className="text-[10px] text-slate-500 font-mono">
                  {new Date(tx.timestamp).toLocaleString()}
                </div>
              </div>
              <span className="font-mono font-bold text-amber-300 shrink-0 ml-4">
                +{tx.xpAmount} XP
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
