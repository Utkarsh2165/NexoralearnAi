import React, { useState, useEffect } from 'react';
import { storage } from '../services/storage';
import { BRAND_CONFIG } from '../config/brand';
import { UserProfile } from '../types';
import { 
  Settings, 
  X, 
  Download, 
  Upload, 
  Trash2, 
  ShieldCheck, 
  CloudOff, 
  Check, 
  AlertCircle, 
  Calendar, 
  BookOpen, 
  Award, 
  Clock, 
  Languages, 
  User, 
  Database,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated?: (updated: UserProfile) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onProfileUpdated }) => {
  const [profile, setProfile] = useState<UserProfile>(() => storage.getUserProfile());
  const [activeTab, setActiveTab] = useState<'profile' | 'cloud' | 'data'>('profile');

  // Form State
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

  // Status & Feedback
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [importNotice, setImportNotice] = useState<string | null>(null);

  // Sync state whenever modal opens
  useEffect(() => {
    if (isOpen) {
      const current = storage.getUserProfile();
      setProfile(current);
      setName(current.name || 'Scholar');
      setGrade(current.grade || 'Class 10 (10th Standard SSC)');
      setBoard(current.board || 'Maharashtra State Board (MSBSHSE - SSC)');
      setExamination(current.examination || 'Class 10 SSC Board Examination');
      setTargetExamDate(current.targetExamDate || '2027-02-15');
      setTargetMarks(current.targetMarksPercentage || 95);
      setCurrentMarks(current.currentMarksPercentage || 78);
      setDailyHours(current.dailyStudyHours || 3.5);
      setLanguage(current.preferredLanguage || 'English');
      setSubjects(
        current.enrolledSubjects && current.enrolledSubjects.length > 0
          ? current.enrolledSubjects
          : BRAND_CONFIG.defaultSscSubjects
      );
      setSaveSuccess(false);
      setValidationError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Dynamic countdown calculation helper
  const calculateDaysRemaining = (dateStr: string) => {
    if (!dateStr) return 0;
    try {
      const target = new Date(dateStr + 'T00:00:00');
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const diffMs = target.getTime() - today.getTime();
      return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    } catch {
      return 0;
    }
  };

  const daysRemaining = calculateDaysRemaining(targetExamDate);

  const toggleSubject = (subj: string) => {
    if (subjects.includes(subj)) {
      if (subjects.length <= 1) {
        setValidationError('You must select at least one study subject.');
        return;
      }
      setSubjects(subjects.filter((s) => s !== subj));
    } else {
      setSubjects([...subjects, subj]);
      setValidationError(null);
    }
  };

  const handleSelectAllSscSubjects = () => {
    setSubjects(BRAND_CONFIG.defaultSscSubjects);
    setValidationError(null);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Validation checks
    if (!name.trim()) {
      setValidationError('Student name is required.');
      return;
    }

    if (!targetExamDate) {
      setValidationError('Please select an examination date.');
      return;
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(targetExamDate)) {
      setValidationError('Please enter a valid examination date (YYYY-MM-DD).');
      return;
    }

    if (daysRemaining < 0) {
      setValidationError('The examination date cannot be in the past. Please select an upcoming date.');
      return;
    }

    if (subjects.length === 0) {
      setValidationError('Please select at least one subject.');
      return;
    }

    const updatedProfile: UserProfile = {
      ...profile,
      name: name.trim(),
      grade,
      board,
      examination,
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

    // Auto-dismiss confirmation after 1.8 seconds or let user click Close
    setTimeout(() => {
      onClose();
    }, 1800);
  };

  const handleExportData = () => {
    const dataStr = storage.exportAllData();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexora_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportNotice('Full study backup downloaded successfully.');
    setTimeout(() => setExportNotice(null), 3000);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = storage.importAllData(content);
      if (success) {
        setImportNotice('Data restored successfully!');
        const updated = storage.getUserProfile();
        setProfile(updated);
        if (onProfileUpdated) onProfileUpdated(updated);
        setTimeout(() => {
          setImportNotice(null);
          onClose();
        }, 1200);
      } else {
        setImportNotice('Invalid backup file. Restoration failed.');
      }
    };
    reader.readAsText(file);
  };

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to reset all local progress, quiz history, and XP? This cannot be undone.')) {
      storage.clearAllData();
      window.location.reload();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-5 sm:p-7 space-y-5 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-violet-950/80 border border-violet-800/60 rounded-xl">
              <Settings className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                Edit Student Profile & Platform Settings
              </h2>
              <p className="text-xs text-slate-400">
                Configure your academic class, education board, SSC subjects, and 2027 exam target.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close Settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-2 rounded-lg font-medium transition-colors cursor-pointer text-center ${
              activeTab === 'profile'
                ? 'bg-slate-800 text-amber-300 shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Academic Profile
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cloud')}
            className={`flex-1 py-2 rounded-lg font-medium transition-colors cursor-pointer text-center ${
              activeTab === 'cloud'
                ? 'bg-slate-800 text-amber-300 shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Cloud & Firebase
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('data')}
            className={`flex-1 py-2 rounded-lg font-medium transition-colors cursor-pointer text-center ${
              activeTab === 'data'
                ? 'bg-slate-800 text-amber-300 shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Data Backup
          </button>
        </div>

        {/* Tab 1: Full Edit Profile Form */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="space-y-5 text-left">
            {/* Student Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Student Name / Preferred Title
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500"
                required
              />
            </div>

            {/* Class (1-12) & Education Board */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Class / Standard (Classes 1–12)
                </label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-violet-500 cursor-pointer"
                >
                  {BRAND_CONFIG.grades.map((g) => (
                    <option key={g} value={g} className="bg-slate-900 text-white">
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Education Board
                </label>
                <select
                  value={board}
                  onChange={(e) => {
                    const newBoard = e.target.value;
                    setBoard(newBoard);
                    if (newBoard.includes('SSC')) {
                      setExamination('Class 10 SSC Board Examination');
                      setSubjects(BRAND_CONFIG.defaultSscSubjects);
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-violet-500 cursor-pointer"
                >
                  {BRAND_CONFIG.boards.map((b) => (
                    <option key={b} value={b} className="bg-slate-900 text-white">
                      {b}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Examination Name & Examination Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Examination Name
                </label>
                <input
                  type="text"
                  value={examination}
                  onChange={(e) => setExamination(e.target.value)}
                  placeholder="e.g. Class 10 SSC Board Examination"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-violet-500"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Target Exam Date
                  </label>
                  <span className="text-[11px] font-mono text-indigo-300">
                    {daysRemaining >= 0 ? `${daysRemaining} days left` : 'Passed'}
                  </span>
                </div>
                <input
                  type="date"
                  value={targetExamDate}
                  onChange={(e) => setTargetExamDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-violet-500 font-mono"
                  required
                />
              </div>
            </div>

            {/* Subjects Selection */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Enrolled Subjects ({subjects.length} Selected)
                </label>
                <button
                  type="button"
                  onClick={handleSelectAllSscSubjects}
                  className="text-xs text-amber-400 hover:text-amber-300 font-medium underline cursor-pointer"
                >
                  Select All Maharashtra Class 10 SSC Subjects
                </button>
              </div>

              <div className="flex flex-wrap gap-2 p-3 bg-slate-950/70 border border-slate-800 rounded-xl max-h-48 overflow-y-auto">
                {BRAND_CONFIG.subjects.map((s) => {
                  const isSelected = subjects.includes(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleSubject(s)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-violet-950/80 border-violet-500 text-violet-200'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                      <span>{s}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Marks & Study Hours */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5 p-3 bg-slate-950 border border-slate-800 rounded-xl">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Current Marks
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="30"
                      max="100"
                      value={currentMarks}
                      onChange={(e) => setCurrentMarks(Math.min(100, Math.max(30, Number(e.target.value))))}
                      className="w-12 bg-slate-900 border border-slate-700 rounded px-1 text-xs text-violet-300 font-bold font-mono text-center focus:outline-none"
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
              </div>

              <div className="space-y-1.5 p-3 bg-slate-950 border border-slate-800 rounded-xl">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Target Goal
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="35"
                      max="100"
                      value={targetMarks}
                      onChange={(e) => setTargetMarks(Math.min(100, Math.max(35, Number(e.target.value))))}
                      className="w-12 bg-slate-900 border border-slate-700 rounded px-1 text-xs text-amber-300 font-bold font-mono text-center focus:outline-none"
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
              </div>

              <div className="space-y-1.5 p-3 bg-slate-950 border border-slate-800 rounded-xl">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Daily Study
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0.5"
                      max="14"
                      step="0.5"
                      value={dailyHours}
                      onChange={(e) => setDailyHours(Math.min(14, Math.max(0.5, Number(e.target.value))))}
                      className="w-12 bg-slate-900 border border-slate-700 rounded px-1 text-xs text-indigo-300 font-bold font-mono text-center focus:outline-none"
                    />
                    <span className="text-xs text-indigo-300 font-bold">h</span>
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
              </div>
            </div>

            {/* Preferred Language */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Preferred Explanation Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-violet-500 cursor-pointer"
              >
                {BRAND_CONFIG.languages.map((l) => (
                  <option key={l.code} value={l.code} className="bg-slate-900 text-white">
                    {l.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Validation Error Alert */}
            {validationError && (
              <div className="p-3.5 bg-rose-950/70 border border-rose-800 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {/* Success Message Banner */}
            {saveSuccess && (
              <div className="p-3.5 bg-emerald-950/70 border border-emerald-800 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Academic profile saved successfully! Dashboard and study tools updated.</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Firebase Cloud Sync Setup Guide */}
        {activeTab === 'cloud' && (
          <div className="space-y-4 text-xs text-slate-300 leading-relaxed text-left">
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center gap-2 font-semibold text-amber-300">
                <CloudOff className="w-4 h-4 text-amber-400" />
                <span>Device-Local Guest Mode (Active & Persistent)</span>
              </div>
              <p className="text-slate-400">
                Your profile, Class 10 Maharashtra SSC goals, quiz history, flashcard review intervals, and XP are securely saved in this browser.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Database className="w-4 h-4 text-indigo-400" />
                <span>Connect Firebase Cloud Sync & Google Sign-In</span>
              </h4>
              <p className="text-slate-400">
                To sync your study progress between your mobile phone and laptop, provide your Firebase configuration in your environment:
              </p>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-[11px] text-indigo-300 overflow-x-auto space-y-0.5">
                <div>VITE_FIREBASE_API_KEY="your-api-key"</div>
                <div>VITE_FIREBASE_AUTH_DOMAIN="your-app.firebaseapp.com"</div>
                <div>VITE_FIREBASE_PROJECT_ID="your-project-id"</div>
                <div>VITE_FIREBASE_STORAGE_BUCKET="your-app.appspot.com"</div>
                <div>VITE_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"</div>
                <div>VITE_FIREBASE_APP_ID="your-app-id"</div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-slate-800 text-slate-200 rounded-xl text-xs font-medium cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Data Backup & Reset */}
        {activeTab === 'data' && (
          <div className="space-y-4 text-left">
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Download className="w-4 h-4 text-indigo-400" />
                <span>Export Progress Backup</span>
              </h4>
              <p className="text-xs text-slate-400">
                Download a JSON file containing all your Class 10 SSC study tasks, flashcards, quiz history, and verified XP ledger.
              </p>
              <button
                type="button"
                onClick={handleExportData}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download JSON Backup</span>
              </button>
              {exportNotice && <p className="text-xs text-emerald-400">{exportNotice}</p>}
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Upload className="w-4 h-4 text-violet-400" />
                <span>Restore Backup File</span>
              </h4>
              <p className="text-xs text-slate-400">
                Import a previously downloaded Nexora backup file to restore your progress.
              </p>
              <input
                type="file"
                accept=".json"
                onChange={handleImportData}
                className="block text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:border-slate-700 file:bg-slate-800 file:text-xs file:text-slate-200 cursor-pointer"
              />
              {importNotice && <p className="text-xs text-indigo-300">{importNotice}</p>}
            </div>

            <div className="p-4 bg-rose-950/30 border border-rose-900/40 rounded-xl space-y-2">
              <h4 className="text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-400" />
                <span>Reset Local Progress</span>
              </h4>
              <p className="text-xs text-rose-200/80">
                Permanently wipes all local progress, flashcards, and XP records from this browser.
              </p>
              <button
                type="button"
                onClick={handleClearData}
                className="px-4 py-2 bg-rose-900/80 hover:bg-rose-800 border border-rose-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Clear All Progress Data
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-slate-800 text-slate-200 rounded-xl text-xs font-medium cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
