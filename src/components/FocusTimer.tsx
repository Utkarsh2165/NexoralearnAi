import React, { useState, useEffect } from 'react';
import { storage } from '../services/storage';
import { BRAND_CONFIG } from '../config/brand';
import { StudySessionLog } from '../types';
import { 
  Clock, 
  Play, 
  Pause, 
  RotateCcw, 
  X, 
  CheckCircle2, 
  Sparkles,
  BookOpen,
  History,
  Trash2
} from 'lucide-react';

interface FocusTimerProps {
  isOpen: boolean;
  onClose: () => void;
  onSessionComplete?: () => void;
}

export const FocusTimer: React.FC<FocusTimerProps> = ({ isOpen, onClose, onSessionComplete }) => {
  const [profile, setProfile] = useState(() => storage.getUserProfile());

  useEffect(() => {
    const handleUpdate = () => {
      const p = storage.getUserProfile();
      setProfile(p);
      if (p.enrolledSubjects && p.enrolledSubjects.length > 0 && !p.enrolledSubjects.includes(subject)) {
        setSubject(p.enrolledSubjects[0]);
      }
    };
    window.addEventListener('nexora-profile-updated', handleUpdate);
    return () => window.removeEventListener('nexora-profile-updated', handleUpdate);
  }, []);

  const [selectedMinutes, setSelectedMinutes] = useState<number>(25);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(25 * 60);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [subject, setSubject] = useState<string>(
    profile.enrolledSubjects && profile.enrolledSubjects.length > 0
      ? profile.enrolledSubjects[0]
      : 'Mathematics Part 1'
  );
  const [completedNotice, setCompletedNotice] = useState<boolean>(false);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [recentSessions, setRecentSessions] = useState<StudySessionLog[]>(() => storage.getStudySessions());

  useEffect(() => {
    let interval: any = null;
    if (isActive && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => prev - 1);
      }, 1000);
    } else if (secondsRemaining === 0 && isActive) {
      setIsActive(false);
      handleFinishSession();
    }
    return () => clearInterval(interval);
  }, [isActive, secondsRemaining]);

  const handleFinishSession = () => {
    storage.recordStudySession(selectedMinutes, subject);
    setRecentSessions(storage.getStudySessions());
    setCompletedNotice(true);
    if (onSessionComplete) onSessionComplete();
  };

  const handleSelectPreset = (minutes: number) => {
    setIsActive(false);
    setSelectedMinutes(minutes);
    setSecondsRemaining(minutes * 60);
    setCompletedNotice(false);
  };

  const handleReset = () => {
    setIsActive(false);
    setSecondsRemaining(selectedMinutes * 60);
    setCompletedNotice(false);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercentage = Math.round(
    ((selectedMinutes * 60 - secondsRemaining) / (selectedMinutes * 60)) * 100
  );

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 sm:p-7 space-y-5 shadow-2xl relative">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Close Focus Timer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title & Badge */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-950 border border-indigo-700/50 mb-2">
            <Clock className="w-6 h-6 text-indigo-400" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">Focus Study Timer</h2>
          <p className="text-xs text-slate-400">
            Pomodoro deep work tracker · Earn +{BRAND_CONFIG.xpRewards.focusSessionCompleted} XP on completion
          </p>
        </div>

        {/* Preset Selector */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: '25m Focus', val: 25 },
            { label: '45m Deep', val: 45 },
            { label: '60m Intensive', val: 60 },
            { label: '5m Break', val: 5 },
          ].map((preset) => (
            <button
              key={preset.val}
              type="button"
              onClick={() => handleSelectPreset(preset.val)}
              className={`py-2 text-[11px] font-semibold rounded-lg border transition-colors cursor-pointer text-center ${
                selectedMinutes === preset.val
                  ? 'bg-indigo-950 border-indigo-500 text-indigo-200'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Subject Tag Selector */}
        <div className="space-y-1 text-left">
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Focus Subject
          </label>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            disabled={isActive}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none disabled:opacity-60 cursor-pointer"
          >
            {profile.enrolledSubjects && profile.enrolledSubjects.length > 0 ? (
              profile.enrolledSubjects.map((s) => (
                <option key={s} value={s} className="bg-slate-900 text-white">
                  {s}
                </option>
              ))
            ) : (
              BRAND_CONFIG.subjects.map((s) => (
                <option key={s} value={s} className="bg-slate-900 text-white">
                  {s}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Timer Display */}
        <div className="py-4 text-center space-y-3">
          <div className="text-5xl sm:text-6xl font-bold font-mono text-white tracking-wider">
            {formatTime(secondsRemaining)}
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2.5 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Session Completed Alert */}
        {completedNotice && (
          <div className="p-3 bg-emerald-950/70 border border-emerald-800 rounded-xl text-center space-y-1 text-emerald-200 text-xs animate-fade-in">
            <div className="font-bold flex items-center justify-center gap-1.5 text-emerald-300">
              <CheckCircle2 className="w-4 h-4" />
              <span>Focus Session Completed!</span>
            </div>
            <p>+{BRAND_CONFIG.xpRewards.focusSessionCompleted} XP awarded and logged into your study analytics.</p>
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setIsActive(!isActive)}
            className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isActive ? (
              <>
                <Pause className="w-4 h-4" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>{secondsRemaining < selectedMinutes * 60 ? 'Resume' : 'Start Focus Session'}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Reset Timer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className={`p-3 rounded-xl border transition-colors cursor-pointer ${
              showHistory
                ? 'bg-indigo-950 border-indigo-500 text-indigo-300'
                : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-300'
            }`}
            title="View Study Session History"
          >
            <History className="w-4 h-4" />
          </button>
        </div>

        {/* Session History View */}
        {showHistory && (
          <div className="pt-3 border-t border-slate-800 text-left space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-200">Recent Completed Sessions</span>
              <span>{recentSessions.length} logged</span>
            </div>

            {recentSessions.length === 0 ? (
              <p className="text-xs text-slate-500 py-2 text-center">No focus sessions completed yet.</p>
            ) : (
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                {recentSessions.slice(0, 8).map((session) => (
                  <div
                    key={session.id}
                    className="p-2 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-medium text-slate-200">{session.subject}</span>
                      <span className="text-slate-500 text-[10px] block">
                        {new Date(session.completedAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <span className="font-mono text-indigo-300 font-bold">{session.durationMinutes} min</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
