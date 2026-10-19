import React, { useState } from 'react';
import { BRAND_CONFIG } from '../config/brand';
import { storage } from '../services/storage';
import { 
  Sparkles, 
  Clock, 
  Menu, 
  X, 
  ShieldCheck, 
  CloudOff, 
  BookOpen,
  Award,
  Flame,
  Settings,
  User
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenTimer: () => void;
  onOpenSettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenTimer,
  onOpenSettings,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profile, setProfile] = useState(() => storage.getUserProfile());
  const [levelInfo, setLevelInfo] = useState(() => storage.getUserLevelInfo());
  const [streakInfo, setStreakInfo] = useState(() => storage.getStreakInfo());

  React.useEffect(() => {
    const handleUpdate = () => {
      setProfile(storage.getUserProfile());
      setLevelInfo(storage.getUserLevelInfo());
      setStreakInfo(storage.getStreakInfo());
    };
    window.addEventListener('nexora-profile-updated', handleUpdate);
    return () => window.removeEventListener('nexora-profile-updated', handleUpdate);
  }, []);

  const navLinks = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'tutor', label: 'AI Tutor' },
    { id: 'quiz', label: 'Quizzes' },
    { id: 'roadmap', label: 'Roadmap' },
    { id: 'math', label: 'Math Lab' },
    { id: 'flashcards', label: 'Flashcards' },
    { id: 'checker', label: 'Answer Check' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'profile', label: 'Profile' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 md:gap-8">
        {/* Zone 1: Brand Title (Single line, single text element wordmark) */}
        <button
          type="button"
          onClick={() => {
            onSelectTab('dashboard');
            setMobileMenuOpen(false);
          }}
          className="text-left flex items-center gap-2.5 focus:outline-none group cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 via-indigo-600 to-amber-400 p-[1px] shadow-sm">
            <div className="w-full h-full bg-slate-950 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-amber-300 group-hover:scale-110 transition-transform" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-base sm:text-lg font-bold tracking-tight text-white whitespace-nowrap">
              {BRAND_CONFIG.name}
            </span>
          </div>
        </button>

        {/* Zone 2: Navigation Links (single-line, desktop) */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          {navLinks.map((link) => {
            const isActive = currentTab === link.id;
            return (
              <button
                key={link.id}
                type="button"
                onClick={() => onSelectTab(link.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-slate-800 text-amber-300 shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary Action & Status */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Daily Streak Indicator */}
          <div 
            title={`Active Study Streak: ${streakInfo.currentStreak} day${streakInfo.currentStreak === 1 ? '' : 's'}`}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-900/90 border border-slate-800 text-xs font-mono text-amber-400 select-none"
          >
            <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500/30" />
            <span className="font-semibold">{streakInfo.currentStreak}d</span>
          </div>

          {/* Level & XP */}
          <div 
            title={`Level ${levelInfo.currentLevel}: ${levelInfo.title} (${levelInfo.totalXp} XP)`}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900/90 border border-slate-800 text-xs text-slate-300 select-none"
          >
            <Award className="w-3.5 h-3.5 text-violet-400" />
            <span className="font-semibold text-violet-300">Lv.{levelInfo.currentLevel}</span>
            <span className="text-slate-500 text-[10px]">·</span>
            <span className="font-mono text-amber-300">{levelInfo.totalXp} XP</span>
          </div>

          {/* Focus Timer Trigger Button */}
          <button
            type="button"
            onClick={onOpenTimer}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/50 text-indigo-200 text-xs font-medium transition-colors cursor-pointer"
            title="Open Focus Study Timer"
          >
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Focus</span>
          </button>

          {/* Profile & Settings Trigger */}
          <button
            type="button"
            onClick={onOpenSettings}
            className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border transition-colors cursor-pointer flex items-center gap-1.5 ${
              currentTab === 'profile'
                ? 'bg-slate-800 border-amber-400/50 text-amber-300'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white'
            }`}
            title="Edit Academic Profile & Settings"
          >
            <Settings className="w-4 h-4 text-amber-400" />
            <span className="hidden xl:inline text-xs font-medium">Profile</span>
          </button>

          {/* Mobile hamburger toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-950 border-b border-slate-800 px-4 pt-2 pb-4 space-y-2 animate-fade-in">
          <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-900 text-xs">
            <span className="text-slate-400">Level {levelInfo.currentLevel} ({levelInfo.title})</span>
            <span className="font-mono text-amber-300 font-semibold">{levelInfo.totalXp} XP</span>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {navLinks.map((link) => {
              const isActive = currentTab === link.id;
              return (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => {
                    onSelectTab(link.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`text-left px-3 py-2 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-slate-800 text-amber-300 font-semibold'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onOpenSettings();
                setMobileMenuOpen(false);
              }}
              className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-medium text-amber-300 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Edit Student Profile</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onOpenTimer();
                setMobileMenuOpen(false);
              }}
              className="py-2 px-3 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/50 rounded-lg text-xs font-medium text-indigo-200 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>Focus</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
