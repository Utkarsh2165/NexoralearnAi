import React, { useState } from 'react';
import { storage } from '../services/storage';
import { api } from '../services/api';
import { BRAND_CONFIG } from '../config/brand';
import { Flashcard, FlashcardDeck } from '../types';
import { MathRenderer } from './MathRenderer';
import { 
  Layers, 
  RotateCw, 
  Sparkles, 
  Check, 
  Plus, 
  Calendar, 
  Award, 
  BookOpen, 
  Trash2,
  AlertCircle
} from 'lucide-react';

export const Flashcards: React.FC = () => {
  const profile = storage.getUserProfile();
  const [decks, setDecks] = useState<FlashcardDeck[]>(storage.getFlashcardDecks());
  const [cards, setCards] = useState<Flashcard[]>(storage.getFlashcards());
  const [selectedDeckId, setSelectedDeckId] = useState<string>(decks[0]?.id || 'deck-kepler');

  // Study review session state
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // AI Generator state
  const [showGenerator, setShowGenerator] = useState<boolean>(false);
  const [genSubject, setGenSubject] = useState<string>(profile.enrolledSubjects[0] || 'Physics');
  const [genTopic, setGenTopic] = useState<string>('Electromagnetism & Faraday\'s Law');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  // Cards in selected deck
  const deckCards = cards.filter((c) => c.deckId === selectedDeckId);
  const dueCards = deckCards.filter((c) => c.nextReviewDate <= todayStr);

  const activeCard = deckCards[currentIndex] || null;

  const handleRating = (rating: 'again' | 'good' | 'easy') => {
    if (!activeCard) return;

    storage.recordCardReview(activeCard.id, rating);
    setCards(storage.getFlashcards());
    setIsFlipped(false);

    if (currentIndex < deckCards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const handleGenerateDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!genTopic.trim()) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await api.summarizeNotes({
        subject: genSubject,
        chapterTitle: genTopic,
        type: 'flashcards',
      });

      if (!res.flashcards || !Array.isArray(res.flashcards) || res.flashcards.length === 0) {
        throw new Error('No flashcards returned from AI generator.');
      }

      const newDeckId = 'deck_' + Date.now();
      const newDeck: FlashcardDeck = {
        id: newDeckId,
        title: `${genTopic} Flashcards`,
        subject: genSubject,
        description: `Key definitions and review cards for ${genTopic}.`,
        cardCount: res.flashcards.length,
        createdAt: new Date().toISOString(),
      };

      const newCards: Flashcard[] = res.flashcards.map((fc: any, idx: number) => ({
        id: 'card_' + Date.now() + '_' + idx,
        deckId: newDeckId,
        front: fc.front,
        back: fc.back,
        subject: genSubject,
        topic: fc.topic || genTopic,
        intervalDays: 1,
        easeFactor: 2.5,
        repetitions: 0,
        nextReviewDate: todayStr,
      }));

      const updatedDecks = [newDeck, ...decks];
      const updatedCards = [...newCards, ...cards];

      storage.saveFlashcardDecks(updatedDecks);
      storage.saveFlashcards(updatedCards);

      setDecks(updatedDecks);
      setCards(updatedCards);
      setSelectedDeckId(newDeckId);
      setCurrentIndex(0);
      setIsFlipped(false);
      setShowGenerator(false);
      setGenTopic('');
    } catch (err: any) {
      console.error('Flashcard Gen Error:', err);
      setErrorMessage(err.message || 'Failed to generate flashcard deck.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Layers className="w-6 h-6 text-emerald-400" />
            <span>Spaced Repetition Flashcards</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Reinforce core definitions, formulas, and laws using spaced interval recall science.
          </p>
        </div>

        <button
          onClick={() => setShowGenerator(!showGenerator)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>{showGenerator ? 'Close Form' : 'Generate AI Deck'}</span>
        </button>
      </div>

      {/* AI Deck Generator Drawer */}
      {showGenerator && (
        <form
          onSubmit={handleGenerateDeck}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 animate-fade-in"
        >
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Generate Targeted AI Deck</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Subject
              </label>
              <select
                value={genSubject}
                onChange={(e) => setGenSubject(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white"
              >
                {BRAND_CONFIG.subjects.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Topic or Chapter Name
              </label>
              <input
                type="text"
                value={genTopic}
                onChange={(e) => setGenTopic(e.target.value)}
                placeholder="e.g. Electromagnetic Induction, Organic Isomers..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white"
                required
              />
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-lg text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-md flex items-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 animate-spin text-amber-300" />
                  <span>Synthesizing High-Yield Deck...</span>
                </>
              ) : (
                <>
                  <Layers className="w-3.5 h-3.5" />
                  <span>Create Flashcard Deck</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Deck Selector Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        {decks.map((deck) => {
          const isSelected = selectedDeckId === deck.id;
          const count = cards.filter((c) => c.deckId === deck.id).length;
          return (
            <button
              key={deck.id}
              onClick={() => {
                setSelectedDeckId(deck.id);
                setCurrentIndex(0);
                setIsFlipped(false);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer flex items-center gap-2 ${
                isSelected
                  ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span>{deck.title}</span>
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-950 text-slate-400">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Flashcard Interactive Stage */}
      {deckCards.length === 0 ? (
        <div className="p-10 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 space-y-2">
          <p className="text-sm">This deck has no cards yet.</p>
          <button
            onClick={() => setShowGenerator(true)}
            className="px-4 py-2 bg-emerald-600 text-white text-xs rounded-lg font-medium"
          >
            Generate Cards with AI
          </button>
        </div>
      ) : activeCard ? (
        <div className="space-y-6">
          {/* Deck Status Bar */}
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-mono">
              Card {currentIndex + 1} of {deckCards.length}
            </span>
            <span className="text-amber-400 font-mono">
              {dueCards.length} due today · +{BRAND_CONFIG.xpRewards.flashcardReviewed} XP per review
            </span>
          </div>

          {/* 3D Flip Card Container */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="relative w-full min-h-[320px] sm:min-h-[360px] bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-10 flex flex-col justify-between shadow-xl cursor-pointer hover:border-slate-700 transition-all select-none"
          >
            {/* Top Indicator */}
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-emerald-400 uppercase tracking-wider text-[11px]">
                {activeCard.topic}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-slate-500">
                <RotateCw className="w-3 h-3" />
                <span>Click to {isFlipped ? 'see front' : 'reveal answer'}</span>
              </span>
            </div>

            {/* Card Content */}
            <div className="py-6 text-center max-w-xl mx-auto space-y-3">
              <div className="text-xs uppercase font-mono text-slate-500">
                {isFlipped ? 'Answer & Explanation' : 'Prompt / Concept'}
              </div>
              <div className="text-base sm:text-lg text-white font-medium leading-relaxed">
                <MathRenderer content={isFlipped ? activeCard.back : activeCard.front} />
              </div>
            </div>

            {/* Bottom Meta */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-4 border-t border-slate-800/60 font-mono">
              <span>Interval: {activeCard.intervalDays}d</span>
              <span>Next review: {activeCard.nextReviewDate}</span>
            </div>
          </div>

          {/* Recall Rating Buttons (Active only when flipped) */}
          <div className="space-y-2">
            <div className="text-center text-xs text-slate-400">
              {isFlipped ? 'Rate your recall speed:' : 'Flip card above to record your recall rating'}
            </div>
            <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
              <button
                disabled={!isFlipped}
                onClick={() => handleRating('again')}
                className="py-3 px-2 bg-rose-950/80 hover:bg-rose-900 border border-rose-800/80 disabled:opacity-40 text-rose-200 text-xs font-semibold rounded-xl transition-all cursor-pointer text-center"
              >
                <div>Again (1d)</div>
                <div className="text-[10px] text-rose-400 font-normal">Forgot / Hard</div>
              </button>

              <button
                disabled={!isFlipped}
                onClick={() => handleRating('good')}
                className="py-3 px-2 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-800/80 disabled:opacity-40 text-indigo-200 text-xs font-semibold rounded-xl transition-all cursor-pointer text-center"
              >
                <div>Good ({Math.max(2, Math.round(activeCard.intervalDays * activeCard.easeFactor))}d)</div>
                <div className="text-[10px] text-indigo-400 font-normal">Recalled with effort</div>
              </button>

              <button
                disabled={!isFlipped}
                onClick={() => handleRating('easy')}
                className="py-3 px-2 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800/80 disabled:opacity-40 text-emerald-200 text-xs font-semibold rounded-xl transition-all cursor-pointer text-center"
              >
                <div>Easy ({Math.max(3, Math.round(activeCard.intervalDays * (activeCard.easeFactor + 0.3)))}d)</div>
                <div className="text-[10px] text-emerald-400 font-normal">Immediate recall</div>
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
