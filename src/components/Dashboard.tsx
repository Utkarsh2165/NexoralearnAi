import React, { useState } from 'react';
import { storage } from '../services/storage';
import { BRAND_CONFIG } from '../config/brand';
import { 
  Flame, 
  Award, 
  Clock, 
  CheckCircle2, 
  Circle, 
  ArrowRight, 
  Sparkles, 
  AlertTriangle, 
  BookOpen, 
  Calculator, 
  Layers, 
  BarChart2, 
  Compass,
  FileCheck2,
  CalendarCheck,
  StickyNote
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { QuickNotesPanel } from './QuickNotesPanel';

interface DashboardProps {
  onNavigate: (tab: string, context?: any) => void;
  onOpenTimer: () => void;
  onOpenSettings?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, onOpenTimer, onOpenSettings }) => {
  const [profile, setProfile] = useState(() => storage.getUserProfile());
  const [levelInfo, setLevelInfo] = useState(() => storage.getUserLevelInfo());
  const [streakInfo, setStreakInfo] = useState(() => storage.getStreakInfo());
  const [roadmap, setRoadmap] = useState(() => storage.getRoadmap());
  const [quizAttempts, setQuizAttempts] = useState(() => storage.getQuizAttempts());
  const [weakTopics, setWeakTopics] = useState(() => storage.getWeakTopics());
  const [weeklyActivity, setWeeklyActivity] = useState(() => storage.getWeeklyActivity());
  const [dueCardsCount, setDueCardsCount] = useState(() => {
    const today = new Date().toISOString().split('T')[0];
    return storage.getFlashcards().filter((c) => c.nextReviewDate <= today).length;
  });

  // Listen for live profile updates from Settings
  React.useEffect(() => {
    const handleProfileUpdate = () => {
      const updated = storage.getUserProfile();
      setProfile(updated);
      setLevelInfo(storage.getUserLevelInfo());
      setStreakInfo(storage.getStreakInfo());
      setRoadmap(storage.getRoadmap());
      setQuizAttempts(storage.getQuizAttempts());
      setWeakTopics(storage.getWeakTopics());
      setWeeklyActivity(storage.getWeeklyActivity());
    };

    window.addEventListener('nexora-profile-updated', handleProfileUpdate);
    return () => window.removeEventListener('nexora-profile-updated', handleProfileUpdate);
  }, []);

  // Calculate real aggregates
  const totalFocusMinutes = storage
    .getStudySessions()
    .reduce((sum, s) => sum + s.durationMinutes, 0);

  const averageAccuracy = quizAttempts.length > 0
    ? Math.round(
        quizAttempts.reduce((sum, q) => sum + q.scorePercentage, 0) / quizAttempts.length
      )
    : 0;

  // Toggle study task
  const handleToggleTask = (taskId: string) => {
    storage.toggleTaskCompletion(taskId);
    setRoadmap(storage.getRoadmap());
    setLevelInfo(storage.getUserLevelInfo());
    setStreakInfo(storage.getStreakInfo());
    setWeeklyActivity(storage.getWeeklyActivity());
  };

  // Format date helper: returns "15 February 2027"
  const formatExamDate = (dateStr: string) => {
    if (!dateStr) return '15 February 2027';
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Dynamic remaining days countdown from current local time
  const daysUntilExam = () => {
    if (!profile.targetExamDate) return null;
    try {
      const [year, month, day] = profile.targetExamDate.split('-').map(Number);
      const targetDate = new Date(year, month - 1, day, 0, 0, 0);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const diffMs = targetDate.getTime() - today.getTime();
      return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    } catch {
      return null;
    }
  };

  const chartData = weeklyActivity.map((d) => {
    const parts = d.date.split('-');
    const label = `${parts[1]}/${parts[2]}`;
    return {
      name: label,
      minutes: d.minutesStudied,
      xp: d.xpEarned,
    };
  });

  const remainingDays = daysUntilExam();

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-12">
      {/* Hero Banner / Greeting */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-slate-800 p-6 md:p-8">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl text-left">
            {/* Academic Board & Exam Tag Strip (Clickable to edit) */}
            <div 
              onClick={() => onNavigate('profile')}
              className="flex flex-wrap items-center gap-2 text-xs font-semibold cursor-pointer group"
              title="Click to edit Class, Board, or Examination"
            >
              <span className="px-2.5 py-1 rounded-md bg-amber-400/10 border border-amber-400/25 text-amber-300 group-hover:border-amber-400 transition-colors">
                {profile.grade}
              </span>
              <span className="text-slate-600">·</span>
              <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-200 group-hover:bg-slate-700 transition-colors">
                {profile.board}
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-300 font-medium group-hover:text-white transition-colors">
                {profile.examination || 'Class 10 SSC Board Examination'}
              </span>
            </div>

            {/* Dynamic Countdown Alert Banner (Clickable to edit date) */}
            <div 
              onClick={() => onNavigate('profile')}
              className="inline-flex flex-wrap items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/60 text-xs cursor-pointer transition-colors"
              title="Click to change your Examination Target Date"
            >
              <span className="text-indigo-300 font-medium">
                Target Exam: <strong className="text-white">{formatExamDate(profile.targetExamDate)}</strong>
              </span>
              <span className="text-slate-500">·</span>
              <span className="font-mono text-amber-300 font-bold">
                {remainingDays !== null && remainingDays >= 0
                  ? `${remainingDays} days remaining`
                  : 'Exam period'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Welcome back, {profile.name}
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed">
              Target marks: <strong className="text-amber-300 font-semibold">{profile.targetMarksPercentage}%</strong> (Current average: {profile.currentMarksPercentage}%).
              Daily study commitment: <strong className="text-indigo-300">{profile.dailyStudyHours} hours</strong>.
            </p>

            {/* Enrolled SSC Subjects Quick Tags */}
            <div 
              onClick={() => onNavigate('profile')}
              className="flex flex-wrap items-center gap-1.5 pt-1 cursor-pointer group"
              title="Click to edit enrolled subjects"
            >
              <span className="text-[11px] text-slate-400 font-medium mr-1 group-hover:text-amber-300 transition-colors">Your Subjects:</span>
              {profile.enrolledSubjects.slice(0, 7).map((subj) => (
                <span
                  key={subj}
                  className="text-[11px] px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300 group-hover:border-slate-700 transition-colors"
                >
                  {subj}
                </span>
              ))}
              {profile.enrolledSubjects.length > 7 && (
                <span className="text-[11px] text-amber-400 font-medium">
                  +{profile.enrolledSubjects.length - 7} more (Edit)
                </span>
              )}
            </div>
          </div>

          {/* Quick CTA Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('tutor')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium text-xs sm:text-sm shadow-md transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Ask AI Tutor</span>
            </button>
            <button
              type="button"
              onClick={onOpenTimer}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 font-medium text-xs sm:text-sm transition-colors cursor-pointer"
            >
              <Clock className="w-4 h-4 text-indigo-400" />
              <span>Start Focus</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('profile')}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-amber-300 font-medium text-xs sm:text-sm transition-colors cursor-pointer"
              title="Edit Academic Profile & Target Date"
            >
              <span>Edit Profile</span>
            </button>
          </div>
        </div>

        {/* Ambient background visual */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-15 pointer-events-none hidden md:block">
          <img
            src={BRAND_CONFIG.images.hero}
            alt="Study Library"
            className="w-full h-full object-cover mix-blend-screen"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>

      {/* Real Metric Highlights Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Streak */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Daily Streak</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {streakInfo.currentStreak} <span className="text-xs text-slate-400 font-sans font-normal">days</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Longest streak: {streakInfo.longestStreak} days
          </div>
        </div>

        {/* Total XP & Level */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Level & XP</span>
            <Award className="w-4 h-4 text-violet-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {levelInfo.totalXp} <span className="text-xs text-amber-400 font-sans font-semibold">XP</span>
          </div>
          <div className="text-[11px] text-violet-300 truncate">
            Lv.{levelInfo.currentLevel} · {levelInfo.title}
          </div>
        </div>

        {/* Focus Study Time */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Focused Study Time</span>
            <Clock className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {Math.floor(totalFocusMinutes / 60)}h {totalFocusMinutes % 60}m
          </div>
          <div className="text-[11px] text-slate-400">
            Goal: {profile.dailyStudyHours}h / day
          </div>
        </div>

        {/* Quiz Accuracy */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Quiz Accuracy</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {quizAttempts.length > 0 ? `${averageAccuracy}%` : '—'}
          </div>
          <div className="text-[11px] text-slate-400">
            {quizAttempts.length} quizzes completed
          </div>
        </div>
      </div>

      {/* Main Workspace Split: Today's Tasks & Analytics Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Tasks (Left 2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-violet-400" />
              <span>Today's Study Plan</span>
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('roadmap')}
              className="text-xs text-violet-400 hover:text-violet-300 font-medium flex items-center gap-1 cursor-pointer"
            >
              <span>View Full Roadmap</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {roadmap.tasks.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/50 border border-slate-800 rounded-xl">
                <p className="text-sm text-slate-400">No tasks generated yet.</p>
                <button
                  type="button"
                  onClick={() => onNavigate('roadmap')}
                  className="mt-3 px-4 py-2 bg-violet-600 text-white rounded-lg text-xs font-medium cursor-pointer"
                >
                  Generate AI Study Roadmap
                </button>
              </div>
            ) : (
              roadmap.tasks.slice(0, 4).map((task) => (
                <div
                  key={task.id}
                  onClick={() => handleToggleTask(task.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-4 ${
                    task.completed
                      ? 'bg-slate-950/40 border-slate-800/60 opacity-60'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      className="mt-0.5 text-slate-400 hover:text-white"
                      aria-label="Toggle task completion"
                    >
                      {task.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-500" />
                      )}
                    </button>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-semibold text-slate-200">{task.subject}</span>
                        <span className="text-slate-600">·</span>
                        <span className="text-slate-400">{task.chapter}</span>
                        <span className="text-slate-600">·</span>
                        <span className="font-mono text-indigo-300">{task.durationMinutes} min</span>
                      </div>
                      <p className={`text-sm ${task.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                        {task.taskDescription}
                      </p>
                      {task.practiceActivity && (
                        <p className="text-xs text-slate-400 flex items-center gap-1.5 pt-0.5">
                          <Compass className="w-3.5 h-3.5 text-amber-400" />
                          <span>{task.practiceActivity}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <span
                    className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded shrink-0 ${
                      task.priority === 'high'
                        ? 'bg-rose-950/80 text-rose-300 border border-rose-800/50'
                        : task.priority === 'medium'
                        ? 'bg-amber-950/80 text-amber-300 border border-amber-800/50'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {task.priority}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Weekly Activity & Quick Action Deck */}
        <div className="space-y-6">
          {/* Weekly Progress Chart */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <BarChart2 className="w-4 h-4 text-indigo-400" />
                <span>Weekly Study Minutes</span>
              </span>
              <span className="text-slate-400 font-mono text-[11px]">Past 7 Days</span>
            </div>

            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} width={24} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#1e293b',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [`${val} min`, 'Study Time']}
                  />
                  <Bar dataKey="minutes" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Due Flashcards Callout */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-amber-300 font-semibold">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>Spaced Repetition Queue</span>
              </div>
              <p className="text-xs text-slate-300">
                {dueCardsCount > 0
                  ? `${dueCardsCount} flashcards due for review today.`
                  : 'All scheduled flashcards reviewed for today!'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('flashcards')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-medium rounded-lg cursor-pointer"
            >
              Review
            </button>
          </div>
        </div>
      </div>

      {/* Weak Topics Requiring Attention */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <span>Weak Topics Detector (From Real Quiz Attempts)</span>
          </h2>
          <span className="text-xs text-slate-400">
            {weakTopics.length} topic{weakTopics.length === 1 ? '' : 's'} identified
          </span>
        </div>

        {weakTopics.length === 0 ? (
          <div className="p-6 bg-slate-900/50 border border-slate-800/80 rounded-xl text-center space-y-2">
            <p className="text-sm text-slate-300">
              No weak topics detected yet! Complete AI quizzes or mock tests to identify topics requiring reinforcement.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('quiz')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium cursor-pointer"
            >
              Take a Practice Quiz Now
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {weakTopics.map((item, idx) => (
              <div
                key={idx}
                className="bg-slate-900/80 border border-amber-900/30 rounded-xl p-4 space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-amber-300">{item.subject}</span>
                  <span className="font-mono text-rose-400 text-xs font-semibold">{item.accuracyRate}% Accuracy</span>
                </div>
                <h3 className="text-sm font-semibold text-white">{item.topic}</h3>
                <p className="text-xs text-slate-400">
                  {item.incorrectAttemptsCount} incorrect answers across {item.totalAttemptsCount} questions.
                </p>
                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onNavigate('tutor', { question: `Explain ${item.topic} step-by-step with practical examples.` })}
                    className="flex-1 py-1.5 bg-violet-950/80 hover:bg-violet-900 border border-violet-800/60 text-violet-200 text-xs font-medium rounded-lg text-center cursor-pointer"
                  >
                    Learn Topic
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('quiz', { subject: item.subject, topic: item.topic })}
                    className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg text-center cursor-pointer"
                  >
                    Quiz Drill
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Access Tools Grid */}
      <div className="space-y-4">
        <h2 className="text-base sm:text-lg font-semibold text-white">All Learning Instruments</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            type="button"
            onClick={() => onNavigate('tutor')}
            className="p-4 bg-slate-900/70 hover:bg-slate-850 border border-slate-800 rounded-xl text-left space-y-2 group transition-all cursor-pointer"
          >
            <Sparkles className="w-5 h-5 text-violet-400 group-hover:scale-110 transition-transform" />
            <div>
              <div className="text-xs font-semibold text-white">AI Tutor</div>
              <div className="text-[11px] text-slate-400">Step-by-step Q&A</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('quiz')}
            className="p-4 bg-slate-900/70 hover:bg-slate-850 border border-slate-800 rounded-xl text-left space-y-2 group transition-all cursor-pointer"
          >
            <FileCheck2 className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
            <div>
              <div className="text-xs font-semibold text-white">Quiz Engine</div>
              <div className="text-[11px] text-slate-400">MCQ & Mock Tests</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('roadmap')}
            className="p-4 bg-slate-900/70 hover:bg-slate-850 border border-slate-800 rounded-xl text-left space-y-2 group transition-all cursor-pointer"
          >
            <Compass className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
            <div>
              <div className="text-xs font-semibold text-white">AI Roadmap</div>
              <div className="text-[11px] text-slate-400">Daily planner & goals</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('math')}
            className="p-4 bg-slate-900/70 hover:bg-slate-850 border border-slate-800 rounded-xl text-left space-y-2 group transition-all cursor-pointer"
          >
            <Calculator className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
            <div>
              <div className="text-xs font-semibold text-white">Math Lab</div>
              <div className="text-[11px] text-slate-400">Solver & Graph plotter</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('flashcards')}
            className="p-4 bg-slate-900/70 hover:bg-slate-850 border border-slate-800 rounded-xl text-left space-y-2 group transition-all cursor-pointer"
          >
            <Layers className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
            <div>
              <div className="text-xs font-semibold text-white">Flashcards</div>
              <div className="text-[11px] text-slate-400">Spaced repetition</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('checker')}
            className="p-4 bg-slate-900/70 hover:bg-slate-850 border border-slate-800 rounded-xl text-left space-y-2 group transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-5 h-5 text-rose-400 group-hover:scale-110 transition-transform" />
            <div>
              <div className="text-xs font-semibold text-white">Answer Check</div>
              <div className="text-[11px] text-slate-400">Rubric scoring</div>
            </div>
          </button>
        </div>
      </div>

      {/* Floating Quick Notes Panel */}
      <QuickNotesPanel currentSubject={profile.enrolledSubjects && profile.enrolledSubjects[0]} />
    </div>
  );
};
