import React, { useState } from 'react';
import { BRAND_CONFIG } from '../config/brand';
import { storage } from '../services/storage';
import { UserProfile } from '../types';
import { CheckCircle2, Sparkles, BookOpen, Target, Calendar, Clock, Globe, X } from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onComplete }) => {
  const existingProfile = storage.getUserProfile();

  const [name, setName] = useState(existingProfile.name || 'Scholar');
  const [grade, setGrade] = useState(existingProfile.grade || 'Class 10 (10th Standard SSC)');
  const [board, setBoard] = useState(existingProfile.board || 'Maharashtra State Board (MSBSHSE - SSC)');
  const [examination, setExamination] = useState(existingProfile.examination || 'Class 10 SSC Board Examination');
  const [subjects, setSubjects] = useState<string[]>(
    existingProfile.enrolledSubjects && existingProfile.enrolledSubjects.length > 0
      ? existingProfile.enrolledSubjects
      : BRAND_CONFIG.defaultSscSubjects
  );
  const [targetDate, setTargetDate] = useState(existingProfile.targetExamDate || '2027-02-15');
  const [targetMarks, setTargetMarks] = useState(existingProfile.targetMarksPercentage || 95);
  const [currentMarks, setCurrentMarks] = useState(existingProfile.currentMarksPercentage || 78);
  const [dailyHours, setDailyHours] = useState(existingProfile.dailyStudyHours || 3.5);
  const [language, setLanguage] = useState(existingProfile.preferredLanguage || 'English');

  if (!isOpen) return null;

  const toggleSubject = (subj: string) => {
    if (subjects.includes(subj)) {
      if (subjects.length > 1) {
        setSubjects(subjects.filter((s) => s !== subj));
      }
    } else {
      setSubjects([...subjects, subj]);
    }
  };

  const handleSave = () => {
    const updated: UserProfile = {
      ...existingProfile,
      name: name.trim() || 'Scholar',
      grade,
      board,
      examination,
      enrolledSubjects: subjects,
      targetExamDate: targetDate,
      targetMarksPercentage: Number(targetMarks),
      currentMarksPercentage: Number(currentMarks),
      dailyStudyHours: Number(dailyHours),
      preferredLanguage: language,
      onboardingCompleted: true,
    };

    storage.saveUserProfile(updated);
    onComplete();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onComplete();
      }}
    >
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full p-6 md:p-8 my-8 shadow-2xl space-y-6 relative">
        {/* Close Button */}
        <button
          type="button"
          onClick={onComplete}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Skip to Dashboard"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-violet-950 border border-violet-800/60 mb-2">
            <Sparkles className="w-6 h-6 text-amber-300" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Personalize Your Study Journey
          </h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Configure your academic level, target goals, and available study hours for tailored AI tutoring and roadmaps.
          </p>
        </div>

        <div className="space-y-5 text-left">
          {/* Student Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Your Name / Preferred Title
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500"
            />
          </div>

          {/* Grade & Board */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Class / Grade Level
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500"
              >
                {BRAND_CONFIG.grades.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Education Board / Exam Target
              </label>
              <select
                value={board}
                onChange={(e) => setBoard(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500"
              >
                {BRAND_CONFIG.boards.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Core Subjects */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Select Your Core Subjects (Click to toggle)
            </label>
            <div className="flex flex-wrap gap-2">
              {BRAND_CONFIG.subjects.map((s) => {
                const isSelected = subjects.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSubject(s)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-violet-950/80 border-violet-500 text-violet-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Academic Level & Goal */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Current Average ({currentMarks}%)
              </label>
              <input
                type="range"
                min="40"
                max="99"
                value={currentMarks}
                onChange={(e) => setCurrentMarks(Number(e.target.value))}
                className="w-full accent-violet-500 cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Target Goal ({targetMarks}%)
              </label>
              <input
                type="range"
                min="50"
                max="100"
                value={targetMarks}
                onChange={(e) => setTargetMarks(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Daily Study Hours ({dailyHours}h)
              </label>
              <input
                type="range"
                min="1"
                max="10"
                step="0.5"
                value={dailyHours}
                onChange={(e) => setDailyHours(Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Exam Target Date & Language */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Target Exam Date
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Preferred Explanation Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500"
              >
                {BRAND_CONFIG.languages.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Notice on Local vs Cloud */}
        <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-lg text-xs text-slate-400">
          <p>
            <strong className="text-slate-300 font-semibold">Device-Local Guest Mode:</strong> Your study progress, XP, and roadmap are safely stored in this browser. You can export a backup or configure Firebase Cloud Sync at any time in Settings.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onComplete}
            className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white text-xs font-medium transition-colors cursor-pointer"
          >
            Skip to Dashboard
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium text-sm rounded-lg shadow-md transition-all cursor-pointer"
          >
            Save & Enter Workspace
          </button>
        </div>
      </div>
    </div>
  );
};
