import React, { useState, useEffect } from 'react';
import { storage } from '../services/storage';
import { BRAND_CONFIG } from '../config/brand';
import { UserProfile } from '../types';
import { 
  User, 
  BookOpen, 
  Calendar, 
  Target, 
  Clock, 
  Globe, 
  Check, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  ArrowLeft,
  RotateCcw,
  GraduationCap,
  ShieldCheck
} from 'lucide-react';

interface EditProfilePageProps {
  onNavigate: (tab: string, context?: any) => void;
  onProfileUpdated?: (updated: UserProfile) => void;
}

export const EditProfilePage: React.FC<EditProfilePageProps> = ({ onNavigate, onProfileUpdated }) => {
  const [profile, setProfile] = useState<UserProfile>(() => storage.getUserProfile());

  // Controlled Form States
  const [name, setName] = useState(profile.name || 'Scholar');
  const [grade, setGrade] = useState(profile.grade || 'Class 10 (10th Standard SSC)');
  const [board, setBoard] = useState(profile.board || 'Maharashtra State Board (MSBSHSE - SSC)');
  const [examination, setExamination] = useState(profile.examination || 'Class 10 SSC Board Examination');
  const [targetExamDate, setTargetExamDate] = useState(profile.targetExamDate || '2027-02-15');
  const [targetMarks, setTargetMarks] = useState<number>(profile.targetMarksPercentage || 95);
  const [currentMarks, setCurrentMarks] = useState<number>(profile.currentMarksPercentage || 78);
  const [dailyHours, setDailyHours] = useState<number>(profile.dailyStudyHours || 3.5);
  const [language, setLanguage] = useState(profile.preferredLanguage || 'English');
  const [subjects, setSubjects] = useState<string[]>(
    profile.enrolledSubjects && profile.enrolledSubjects.length > 0
      ? profile.enrolledSubjects
      : BRAND_CONFIG.defaultSscSubjects
  );

  // Status & Feedback States
  const [validationError, setValidationError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Live countdown calculation helper
  const calculateDaysRemaining = (dateStr: string) => {
    if (!dateStr) return null;
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      if (!year || !month || !day) return null;
      const targetDate = new Date(year, month - 1, day, 0, 0, 0);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const diffMs = targetDate.getTime() - today.getTime();
      return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    } catch {
      return null;
    }
  };

  const daysRemaining = calculateDaysRemaining(targetExamDate);

  // Subject toggling with instant feedback
  const toggleSubject = (subj: string) => {
    if (subjects.includes(subj)) {
      if (subjects.length <= 1) {
        setValidationError('You must select at least one study subject.');
        return;
      }
      setSubjects(subjects.filter((s) => s !== subj));
      setValidationError(null);
    } else {
      setSubjects([...subjects, subj]);
      setValidationError(null);
    }
  };

  // Quick preset: Select all 9 Maharashtra SSC Subjects
  const handleSelectAllSscSubjects = () => {
    setSubjects(BRAND_CONFIG.defaultSscSubjects);
    setValidationError(null);
  };

  // Prepopulate Class 10 Maharashtra SSC requested defaults
  const handleResetToRequestedSscDefaults = () => {
    setGrade('Class 10 (10th Standard SSC)');
    setBoard('Maharashtra State Board (MSBSHSE - SSC)');
    setExamination('Class 10 SSC Board Examination');
    setTargetExamDate('2027-02-15');
    setTargetMarks(95);
    setCurrentMarks(78);
    setDailyHours(3.5);
    setLanguage('English');
    setSubjects(BRAND_CONFIG.defaultSscSubjects);
    setValidationError(null);
  };

  const handleBoardChange = (newBoard: string) => {
    setBoard(newBoard);
    if (newBoard.includes('SSC')) {
      setExamination('Class 10 SSC Board Examination');
      setGrade('Class 10 (10th Standard SSC)');
      setSubjects(BRAND_CONFIG.defaultSscSubjects);
    } else if (newBoard.includes('HSC')) {
      setExamination('Class 12 HSC Board Examination');
      setGrade('Class 12 (HSC / 12th Standard)');
    } else if (newBoard.includes('CBSE')) {
      setExamination('CBSE Class 10 Board Examination');
    } else if (newBoard.includes('ICSE')) {
      setExamination('ICSE Class 10 Board Examination');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Validation checks
    if (!name.trim()) {
      setValidationError('Student name or title is required.');
      return;
    }

    if (!targetExamDate) {
      setValidationError('Please select an examination target date.');
      return;
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(targetExamDate)) {
      setValidationError('Invalid date format. Please select a valid date (YYYY-MM-DD).');
      return;
    }

    if (daysRemaining !== null && daysRemaining < 0) {
      setValidationError('The examination date cannot be in the past. Please select an upcoming target date.');
      return;
    }

    if (subjects.length === 0) {
      setValidationError('Please select at least one study subject.');
      return;
    }

    if (targetMarks < 35 || targetMarks > 100) {
      setValidationError('Target marks percentage must be between 35% and 100%.');
      return;
    }

    const updatedProfile: UserProfile = {
      ...profile,
      name: name.trim(),
      grade,
      board,
      examination: examination.trim() || 'Class 10 SSC Board Examination',
      targetExamDate,
      targetMarksPercentage: Number(targetMarks),
      currentMarksPercentage: Number(currentMarks),
      dailyStudyHours: Number(dailyHours),
      preferredLanguage: language,
      enrolledSubjects: subjects,
      onboardingCompleted: true,
    };

    // Save to persistent storage
    storage.saveUserProfile(updatedProfile);
    setProfile(updatedProfile);
    setSaveSuccess(true);

    if (onProfileUpdated) {
      onProfileUpdated(updatedProfile);
    }

    // Refresh dashboard state immediately and navigate back
    setTimeout(() => {
      onNavigate('dashboard');
    }, 1200);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16 animate-fade-in text-left">
      {/* Top Header / Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-300 transition-colors cursor-pointer mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <GraduationCap className="w-7 h-7 text-amber-400" />
            <span>Edit Student Profile & Target</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Customize your academic grade, examination board, subjects, and dynamic 2027 examination target date.
          </p>
        </div>

        {/* Quick Reset to Class 10 SSC Button */}
        <button
          type="button"
          onClick={handleResetToRequestedSscDefaults}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-amber-300 transition-colors cursor-pointer"
          title="Prepopulate Class 10, Maharashtra SSC, and 15 February 2027 exam date"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Apply Class 10 SSC Preset</span>
        </button>
      </div>

      {/* Target Countdown Pill Card */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/70 via-slate-900 to-violet-950/70 border border-indigo-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-900/60 border border-indigo-700/50 text-indigo-300">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">
              Selected Target Examination Date
            </div>
            <div className="text-sm sm:text-base font-bold text-white">
              {targetExamDate ? (
                (() => {
                  try {
                    const [y, m, d] = targetExamDate.split('-').map(Number);
                    return new Date(y, m - 1, d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
                  } catch {
                    return targetExamDate;
                  }
                })()
              ) : 'No date set'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 font-mono text-xs">
          <span className="text-slate-400">Remaining:</span>
          <span className="font-bold text-amber-300">
            {daysRemaining !== null && daysRemaining >= 0
              ? `${daysRemaining} days`
              : daysRemaining !== null
              ? 'Past date'
              : 'Invalid date'}
          </span>
        </div>
      </div>

      {/* Main Profile Form */}
      <form onSubmit={handleSubmit} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-8 space-y-6 shadow-xl">
        {/* Student Name */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
            Student Name / Title <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Alex"
            className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-colors"
            required
          />
        </div>

        {/* Class/Standard & Board Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Class / Standard Dropdown (Classes 1–12) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Class / Standard (Classes 1–12) <span className="text-rose-400">*</span>
            </label>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-xl px-4 py-3 text-xs sm:text-sm text-white focus:outline-none cursor-pointer"
            >
              {BRAND_CONFIG.grades.map((g) => (
                <option key={g} value={g} className="bg-slate-900 text-white">
                  {g}
                </option>
              ))}
            </select>
          </div>

          {/* Education Board Dropdown */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Education Board <span className="text-rose-400">*</span>
            </label>
            <select
              value={board}
              onChange={(e) => handleBoardChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-xl px-4 py-3 text-xs sm:text-sm text-white focus:outline-none cursor-pointer"
            >
              {BRAND_CONFIG.boards.map((b) => (
                <option key={b} value={b} className="bg-slate-900 text-white">
                  {b}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Examination Name & Date Picker */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Examination Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Examination Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={examination}
              onChange={(e) => setExamination(e.target.value)}
              placeholder="e.g. Class 10 SSC Board Examination"
              className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-xl px-4 py-3 text-xs sm:text-sm text-white focus:outline-none"
              required
            />
          </div>

          {/* Target Examination Date */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Examination Date <span className="text-rose-400">*</span>
              </label>
              <span className="text-[11px] font-mono text-amber-300">
                {daysRemaining !== null && daysRemaining >= 0
                  ? `${daysRemaining} days remaining`
                  : 'Selected date'}
              </span>
            </div>
            <input
              type="date"
              value={targetExamDate}
              onChange={(e) => {
                setTargetExamDate(e.target.value);
                setValidationError(null);
              }}
              className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-xl px-4 py-3 text-xs sm:text-sm text-white font-mono focus:outline-none cursor-pointer"
              required
            />
          </div>
        </div>

        {/* Subject Selection (Multi-select) */}
        <div className="space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Enrolled Subjects ({subjects.length} Selected) <span className="text-rose-400">*</span>
            </label>
            <button
              type="button"
              onClick={handleSelectAllSscSubjects}
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 underline cursor-pointer text-left sm:text-right"
            >
              Select All 9 Maharashtra Class 10 SSC Subjects
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 p-3.5 bg-slate-950 border border-slate-800 rounded-xl max-h-64 overflow-y-auto">
            {BRAND_CONFIG.subjects.map((subj) => {
              const isSelected = subjects.includes(subj);
              return (
                <button
                  key={subj}
                  type="button"
                  onClick={() => toggleSubject(subj)}
                  className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all text-left flex items-center justify-between gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-violet-950/80 border-violet-500 text-white shadow-xs'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <span className="truncate">{subj}</span>
                  {isSelected ? (
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <span className="w-3.5 h-3.5 rounded-full border border-slate-700 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Target Marks & Daily Available Study Hours */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-2">
          {/* Target Percentage */}
          <div className="space-y-2 p-3.5 bg-slate-950 border border-slate-800 rounded-xl">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Target Marks
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="35"
                  max="100"
                  value={targetMarks}
                  onChange={(e) => setTargetMarks(Math.min(100, Math.max(35, Number(e.target.value))))}
                  className="w-14 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-amber-300 font-bold font-mono text-center focus:outline-none"
                />
                <span className="text-xs text-amber-300 font-bold">%</span>
              </div>
            </div>
            <input
              type="range"
              min="50"
              max="100"
              value={targetMarks}
              onChange={(e) => setTargetMarks(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>50%</span>
              <span className="text-amber-400 font-semibold">{targetMarks}% Goal</span>
              <span>100%</span>
            </div>
          </div>

          {/* Current Percentage */}
          <div className="space-y-2 p-3.5 bg-slate-950 border border-slate-800 rounded-xl">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Current Average
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="30"
                  max="100"
                  value={currentMarks}
                  onChange={(e) => setCurrentMarks(Math.min(100, Math.max(30, Number(e.target.value))))}
                  className="w-14 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-violet-300 font-bold font-mono text-center focus:outline-none"
                />
                <span className="text-xs text-violet-300 font-bold">%</span>
              </div>
            </div>
            <input
              type="range"
              min="35"
              max="99"
              value={currentMarks}
              onChange={(e) => setCurrentMarks(Number(e.target.value))}
              className="w-full accent-violet-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>35%</span>
              <span className="text-violet-300 font-semibold">{currentMarks}% Current</span>
              <span>99%</span>
            </div>
          </div>

          {/* Daily Study Time */}
          <div className="space-y-2 p-3.5 bg-slate-950 border border-slate-800 rounded-xl">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Daily Study Time
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0.5"
                  max="14"
                  step="0.5"
                  value={dailyHours}
                  onChange={(e) => setDailyHours(Math.min(14, Math.max(0.5, Number(e.target.value))))}
                  className="w-14 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-indigo-300 font-bold font-mono text-center focus:outline-none"
                />
                <span className="text-xs text-indigo-300 font-bold">hrs</span>
              </div>
            </div>
            <input
              type="range"
              min="1"
              max="12"
              step="0.5"
              value={dailyHours}
              onChange={(e) => setDailyHours(Number(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>1h</span>
              <span className="text-indigo-300 font-semibold">{dailyHours}h / day</span>
              <span>12h</span>
            </div>
          </div>
        </div>

        {/* Preferred Explanation Language */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
            Preferred Explanation Language
          </label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-xl px-4 py-3 text-xs sm:text-sm text-white focus:outline-none cursor-pointer"
          >
            {BRAND_CONFIG.languages.map((l) => (
              <option key={l.code} value={l.code} className="bg-slate-900 text-white">
                {l.label}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-slate-400">
            AI Tutor and roadmaps will tailor explanations in this language when requested.
          </p>
        </div>

        {/* Validation Error Message */}
        {validationError && (
          <div className="p-4 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-300 text-xs sm:text-sm flex items-center gap-2.5 animate-shake">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Success Banner */}
        {saveSuccess && (
          <div className="p-4 bg-emerald-950/80 border border-emerald-800 rounded-xl text-emerald-200 text-xs sm:text-sm flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
            <div>
              <div className="font-bold text-emerald-300">Profile saved successfully!</div>
              <div className="text-xs text-emerald-400">
                Dashboard updated with your Class 10 Maharashtra SSC goals. Returning to dashboard...
              </div>
            </div>
          </div>
        )}

        {/* Form Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer text-center"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="w-full sm:w-auto px-7 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>Save Changes</span>
          </button>
        </div>
      </form>
    </div>
  );
};
