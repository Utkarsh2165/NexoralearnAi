import React, { useState, useEffect } from 'react';
import { storage } from './services/storage';
import { BRAND_CONFIG } from './config/brand';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { EditProfilePage } from './components/EditProfilePage';
import { AiTutor } from './components/AiTutor';
import { QuizEngine } from './components/QuizEngine';
import { StudyRoadmap } from './components/StudyRoadmap';
import { MathLab } from './components/MathLab';
import { Flashcards } from './components/Flashcards';
import { AnswerChecker } from './components/AnswerChecker';
import { AnalyticsView } from './components/AnalyticsView';
import { FocusTimer } from './components/FocusTimer';
import { OnboardingModal } from './components/OnboardingModal';
import { SettingsModal } from './components/SettingsModal';
import { Sparkles, Heart } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [navContext, setNavContext] = useState<any>(null);
  const [timerOpen, setTimerOpen] = useState<boolean>(false);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);

  // Safeguard: Only show onboarding if explicitly required and not yet marked completed
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);

  const handleNavigate = (tab: string, context?: any) => {
    setCurrentTab(tab);
    setNavContext(context || null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-violet-600 selection:text-white">
      {/* 3-Zone Navigation Header */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => handleNavigate(tab)}
        onOpenTimer={() => setTimerOpen(true)}
        onOpenSettings={() => handleNavigate('profile')}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {currentTab === 'dashboard' && (
          <Dashboard
            onNavigate={(tab, ctx) => handleNavigate(tab, ctx)}
            onOpenTimer={() => setTimerOpen(true)}
            onOpenSettings={() => handleNavigate('profile')}
          />
        )}

        {currentTab === 'profile' && (
          <EditProfilePage
            onNavigate={(tab, ctx) => handleNavigate(tab, ctx)}
            onProfileUpdated={(updated) => {
              storage.saveUserProfile(updated);
            }}
          />
        )}

        {currentTab === 'tutor' && (
          <AiTutor initialPrompt={navContext?.question} />
        )}

        {currentTab === 'quiz' && (
          <QuizEngine
            initialSubject={navContext?.subject}
            initialTopic={navContext?.topic}
          />
        )}

        {currentTab === 'roadmap' && (
          <StudyRoadmap />
        )}

        {currentTab === 'math' && (
          <MathLab />
        )}

        {currentTab === 'flashcards' && (
          <Flashcards />
        )}

        {currentTab === 'checker' && (
          <AnswerChecker />
        )}

        {currentTab === 'analytics' && (
          <AnalyticsView />
        )}
      </main>

      {/* Global Modals */}
      <FocusTimer
        isOpen={timerOpen}
        onClose={() => setTimerOpen(false)}
      />

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onProfileUpdated={(updated) => {
          storage.saveUserProfile(updated);
        }}
      />

      <OnboardingModal
        isOpen={showOnboarding}
        onComplete={() => setShowOnboarding(false)}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950/80 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">{BRAND_CONFIG.name}</span>
            <span>·</span>
            <span>{BRAND_CONFIG.tagline}</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <button
              type="button"
              onClick={() => handleNavigate('profile')}
              className="hover:text-amber-300 transition-colors cursor-pointer"
            >
              Edit Student Profile
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Cloud & Sync Settings
            </button>
            <span>·</span>
            <span>Device-Local Guest Mode Active</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
