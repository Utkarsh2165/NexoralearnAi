import React, { useState } from 'react';
import { api } from '../services/api';
import { storage } from '../services/storage';
import { BRAND_CONFIG } from '../config/brand';
import { StudyRoadmap as RoadmapType, StudyTask } from '../types';
import { 
  Compass, 
  Sparkles, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Circle, 
  Plus, 
  RotateCcw, 
  AlertCircle, 
  BarChart, 
  BookOpen, 
  Coffee,
  Check
} from 'lucide-react';

export const StudyRoadmap: React.FC = () => {
  const [profile, setProfile] = useState(() => storage.getUserProfile());
  const [roadmap, setRoadmap] = useState<RoadmapType>(() => storage.getRoadmap());
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [showNewTaskModal, setShowNewTaskModal] = useState<boolean>(false);

  // Listen for live profile updates
  React.useEffect(() => {
    const handleUpdate = () => {
      setProfile(storage.getUserProfile());
      setRoadmap(storage.getRoadmap());
    };
    window.addEventListener('nexora-profile-updated', handleUpdate);
    return () => window.removeEventListener('nexora-profile-updated', handleUpdate);
  }, []);

  // New task form state
  const [newSubject, setNewSubject] = useState(
    profile.enrolledSubjects[0] || 'Science & Technology Part 1'
  );
  const [newChapter, setNewChapter] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDuration, setNewDuration] = useState(45);
  const [newPriority, setNewPriority] = useState<'high' | 'medium' | 'low'>('medium');

  // Study Time Calculator Math
  const calculateTotalAvailableHours = () => {
    if (!profile.targetExamDate) return 0;
    try {
      const [year, month, day] = profile.targetExamDate.split('-').map(Number);
      const targetDate = new Date(year, month - 1, day, 0, 0, 0);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const diffMs = targetDate.getTime() - today.getTime();
      const days = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      return Math.round(days * (profile.dailyStudyHours || 3.5));
    } catch {
      return 0;
    }
  };

  const totalAvailableHours = calculateTotalAvailableHours();
  const completedTasks = roadmap.tasks.filter((t) => t.completed);
  const progressPercent = roadmap.tasks.length > 0
    ? Math.round((completedTasks.length / roadmap.tasks.length) * 100)
    : 0;

  const handleToggleTask = (taskId: string) => {
    storage.toggleTaskCompletion(taskId);
    setRoadmap(storage.getRoadmap());
  };

  const handleRegenerate = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const weakTopics = storage.getWeakTopics().map((w) => `${w.subject}: ${w.topic}`);
      const res = await api.generateRoadmap({
        classLevel: profile.grade,
        board: profile.board,
        examDate: profile.targetExamDate,
        currentMarks: `${profile.currentMarksPercentage}%`,
        targetMarks: `${profile.targetMarksPercentage}%`,
        dailyHours: profile.dailyStudyHours,
        subjects: profile.enrolledSubjects,
        weakTopics,
      });

      if (!res.dailyTasks || !Array.isArray(res.dailyTasks)) {
        throw new Error('Invalid roadmap data received from AI service.');
      }

      const newRoadmap: RoadmapType = {
        id: 'roadmap_' + Date.now(),
        title: res.roadmapTitle || 'Personalized Study Roadmap',
        overview: res.overview || 'Adaptive preparation plan.',
        generatedAt: new Date().toISOString(),
        tasks: res.dailyTasks.map((t: any, idx: number) => ({
          ...t,
          id: t.id || 'task_' + Date.now() + '_' + idx,
          completed: false,
        })),
        weeklyHoursAllocation: res.weeklyHoursAllocation || [],
        revisionMilestones: res.revisionMilestones || [],
      };

      storage.saveRoadmap(newRoadmap);
      setRoadmap(newRoadmap);
    } catch (err: any) {
      console.error('Roadmap Gen Error:', err);
      setErrorMessage(
        err.message || 'Failed to generate study roadmap. Please verify network or server status.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChapter.trim() || !newDescription.trim()) return;

    storage.addTask({
      dayLabel: 'Custom',
      subject: newSubject,
      chapter: newChapter.trim(),
      taskDescription: newDescription.trim(),
      durationMinutes: newDuration,
      priority: newPriority,
      completed: false,
    });

    setRoadmap(storage.getRoadmap());
    setNewChapter('');
    setNewDescription('');
    setShowNewTaskModal(false);
  };

  const filteredTasks = roadmap.tasks.filter((t) => {
    if (activeFilter === 'pending') return !t.completed;
    if (activeFilter === 'completed') return t.completed;
    return true;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in pb-12">
      {/* Roadmap Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
              <Compass className="w-4 h-4" />
              <span>Personalized Study Roadmap</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-400">{profile.board}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              {roadmap.title}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowNewTaskModal(true)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium border border-slate-700 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-violet-400" />
              <span>Add Custom Task</span>
            </button>
            <button
              onClick={handleRegenerate}
              disabled={loading}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{loading ? 'Recalculating...' : 'Regenerate with AI'}</span>
            </button>
          </div>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
          {roadmap.overview}
        </p>

        {/* Study Time Calculator & Target Progress Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>Total Available Time to Exam</span>
            </div>
            <div className="text-lg font-bold font-mono text-white mt-1">
              {totalAvailableHours} <span className="text-xs font-sans text-slate-400 font-normal">study hours</span>
            </div>
            <div className="text-[11px] text-slate-500">Based on {profile.dailyStudyHours}h daily goal</div>
          </div>

          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <BarChart className="w-3.5 h-3.5 text-amber-400" />
              <span>Plan Progress</span>
            </div>
            <div className="text-lg font-bold font-mono text-amber-300 mt-1">
              {progressPercent}%
            </div>
            <div className="text-[11px] text-slate-500">
              {completedTasks.length} of {roadmap.tasks.length} tasks completed
            </div>
          </div>

          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>Target Exam Date</span>
            </div>
            <div className="text-base sm:text-lg font-bold font-mono text-white mt-1">
              {profile.targetExamDate === '2027-02-15'
                ? '15 February 2027'
                : new Date(profile.targetExamDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
            <div className="text-[11px] text-slate-500">Target Goal: {profile.targetMarksPercentage}% · {profile.board}</div>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-950/60 border border-rose-800 rounded-xl text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Task Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl">
          {(['all', 'pending', 'completed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-colors cursor-pointer ${
                activeFilter === f
                  ? 'bg-slate-800 text-amber-300 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {f} ({f === 'all' ? roadmap.tasks.length : f === 'pending' ? roadmap.tasks.filter((t) => !t.completed).length : completedTasks.length})
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-400">
          Earn +{BRAND_CONFIG.xpRewards.studyTaskCompleted} XP per completed task
        </span>
      </div>

      {/* Task Cards Grid */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/50 border border-slate-800 rounded-xl text-slate-400 text-sm">
            No tasks match the active filter.
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              onClick={() => handleToggleTask(task.id)}
              className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer ${
                task.completed
                  ? 'bg-slate-950/40 border-slate-800/60 opacity-60'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 shadow-xs'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <button
                  type="button"
                  className="mt-0.5 text-slate-400 hover:text-white cursor-pointer"
                  aria-label="Toggle task completion"
                >
                  {task.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-500" />
                  )}
                </button>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-semibold text-white">{task.subject}</span>
                    <span className="text-slate-600">·</span>
                    <span className="text-slate-300 font-medium">{task.chapter}</span>
                    <span className="text-slate-600">·</span>
                    <span className="font-mono text-indigo-300">{task.durationMinutes} min</span>
                    {task.dayLabel && (
                      <>
                        <span className="text-slate-600">·</span>
                        <span className="text-slate-400">{task.dayLabel}</span>
                      </>
                    )}
                  </div>

                  <p className={`text-sm ${task.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                    {task.taskDescription}
                  </p>

                  {task.practiceActivity && (
                    <div className="flex items-center gap-1.5 text-xs text-amber-300/90 pt-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>{task.practiceActivity}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                {task.suggestedBreakMinutes && (
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Coffee className="w-3.5 h-3.5 text-slate-500" />
                    <span>{task.suggestedBreakMinutes}m break</span>
                  </span>
                )}
                <span
                  className={`text-[10px] font-semibold uppercase px-2.5 py-1 rounded-md ${
                    task.priority === 'high'
                      ? 'bg-rose-950 text-rose-300 border border-rose-800/60'
                      : task.priority === 'medium'
                      ? 'bg-amber-950 text-amber-300 border border-amber-800/60'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {task.priority}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Custom Task Modal */}
      {showNewTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Add Custom Study Task</h3>
            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Subject</label>
                <select
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white"
                >
                  {BRAND_CONFIG.subjects.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Chapter Name</label>
                <input
                  type="text"
                  value={newChapter}
                  onChange={(e) => setNewChapter(e.target.value)}
                  placeholder="e.g. Wave Optics, Thermodynamics"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Task Description</label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="e.g. Read section 4.2 and solve 10 numericals"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Duration (min)</label>
                  <input
                    type="number"
                    min="15"
                    max="180"
                    value={newDuration}
                    onChange={(e) => setNewDuration(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e: any) => setNewPriority(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNewTaskModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-medium"
                >
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
