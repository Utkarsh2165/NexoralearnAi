import React, { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';
import { storage } from '../services/storage';
import { BRAND_CONFIG } from '../config/brand';
import { MathRenderer } from './MathRenderer';
import { 
  Send, 
  Sparkles, 
  Paperclip, 
  Copy, 
  Check, 
  RotateCcw, 
  Bookmark, 
  Trash2, 
  Flag, 
  Image as ImageIcon, 
  AlertCircle,
  HelpCircle,
  BookOpen
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  image?: string;
  flagged?: boolean;
}

interface AiTutorProps {
  initialPrompt?: string;
}

export const AiTutor: React.FC<AiTutorProps> = ({ initialPrompt }) => {
  const [profile, setProfile] = useState(() => storage.getUserProfile());

  // Listen for live profile updates
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

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      text: `Hello ${profile.name}! I am your Nexora AI study mentor for **${profile.grade}** (${profile.board}). 

Ask me any question from your curriculum:
- *"Explain Kepler's three laws of planetary motion step-by-step with formulas (Science 1)"*
- *"How to solve linear equations using Cramer's Determinant Rule (Mathematics 1)?"*
- *"State and prove the Basic Proportionality Theorem (Mathematics 2)"*
- *"Describe the phases of aerobic cellular respiration: Glycolysis and Krebs Cycle (Science 2)"*
- *"Compare the physiography and river drainage of India and Brazil (Geography)"*`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState(initialPrompt || '');
  const [subject, setSubject] = useState(profile.enrolledSubjects[0] || 'Science & Technology Part 1');
  const [mode, setMode] = useState<'concise' | 'detailed' | 'exam' | 'simple'>('detailed');
  const [language, setLanguage] = useState(profile.preferredLanguage || 'English');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<{ mimeType: string; data: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (PNG, JPEG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setSelectedImage({
        mimeType: file.type,
        data: dataUrl,
      });
      setErrorMessage(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSend = async (customText?: string) => {
    const textToSend = customText || input;
    if ((!textToSend.trim() && !selectedImage) || loading) return;

    const userMsg: Message = {
      id: 'msg_' + Date.now(),
      role: 'user',
      text: textToSend,
      image: selectedImage?.data,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    const currentImage = selectedImage;
    setSelectedImage(null);
    setLoading(true);
    setErrorMessage(null);

    try {
      // Build conversation history payload
      const history = messages
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({
          role: m.role,
          text: m.text,
        }));

      const res = await api.sendChatMessage({
        message: textToSend,
        conversationHistory: history,
        subject,
        mode,
        language,
        image: currentImage || undefined,
      });

      const modelMsg: Message = {
        id: 'reply_' + Date.now(),
        role: 'model',
        text: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, modelMsg]);
    } catch (err: any) {
      console.error('Tutor API Error:', err);
      setErrorMessage(
        err.message || 'Failed to reach AI tutor service. Please check your connection or server status.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveToNotebook = (msg: Message) => {
    const userQuestion = messages.find((m, idx) => {
      const currentIdx = messages.findIndex((x) => x.id === msg.id);
      return idx === currentIdx - 1 && m.role === 'user';
    })?.text || 'Academic Question';

    storage.saveChatExchange({
      id: 'chat_' + Date.now(),
      subject,
      question: userQuestion,
      answer: msg.text,
      savedAt: new Date().toISOString(),
      bookmarked: true,
    });

    setSavedId(msg.id);
    setTimeout(() => setSavedId(null), 2500);
  };

  const handleFlagCorrection = (id: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, flagged: true } : m))
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] min-h-[580px] bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Tutor Control Toolbar */}
      <div className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Subject & Explanation Mode */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Subject Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1">
            <BookOpen className="w-3.5 h-3.5 text-violet-400" />
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
            >
              {BRAND_CONFIG.subjects.map((s) => (
                <option key={s} value={s} className="bg-slate-900 text-white">
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Mode Selector */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 p-0.5 rounded-lg">
            {(
              [
                { id: 'detailed', label: 'Detailed' },
                { id: 'concise', label: 'Concise' },
                { id: 'exam', label: 'Exam Focus' },
                { id: 'simple', label: 'ELI5' },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                onClick={() => setMode(item.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                  mode === item.id
                    ? 'bg-violet-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Language Selector */}
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-300 text-xs focus:outline-none cursor-pointer"
          >
            {BRAND_CONFIG.languages.map((l) => (
              <option key={l.code} value={l.code} className="bg-slate-900 text-white">
                {l.label}
              </option>
            ))}
          </select>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              setMessages([
                {
                  id: 'welcome_' + Date.now(),
                  role: 'model',
                  text: 'Chat cleared. Ask your next question!',
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                },
              ])
            }
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
            title="Clear Chat History"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 sm:gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 p-[1px] shrink-0 mt-1 shadow-sm">
                  <div className="w-full h-full bg-slate-950 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-amber-300" />
                  </div>
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-2xl rounded-2xl p-4 sm:p-5 space-y-2 border ${
                  isUser
                    ? 'bg-violet-950/40 border-violet-800/50 text-violet-100 rounded-tr-xs'
                    : 'bg-slate-900/90 border-slate-800 text-slate-100 rounded-tl-xs shadow-md'
                }`}
              >
                {/* User attached image thumbnail */}
                {msg.image && (
                  <div className="mb-2 max-w-sm rounded-lg overflow-hidden border border-slate-700">
                    <img
                      src={msg.image}
                      alt="Homework Question"
                      className="w-full h-auto max-h-60 object-contain bg-slate-950"
                    />
                  </div>
                )}

                {/* Content */}
                <MathRenderer content={msg.text} />

                {/* Footer Controls for Model Responses */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[11px] text-slate-400">
                  <span className="font-mono">{msg.timestamp}</span>

                  {!isUser && (
                    <div className="flex items-center gap-3">
                      {/* Copy */}
                      <button
                        onClick={() => handleCopy(msg.text, msg.id)}
                        className="hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                        title="Copy to clipboard"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>

                      {/* Save to Notebook */}
                      <button
                        onClick={() => handleSaveToNotebook(msg)}
                        className="hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                        title="Save to study notebook"
                      >
                        {savedId === msg.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-amber-400" />
                            <span className="text-amber-400">Saved</span>
                          </>
                        ) : (
                          <>
                            <Bookmark className="w-3.5 h-3.5" />
                            <span>Save</span>
                          </>
                        )}
                      </button>

                      {/* Flag Correction */}
                      <button
                        onClick={() => handleFlagCorrection(msg.id)}
                        className={`hover:text-rose-400 flex items-center gap-1 transition-colors cursor-pointer ${
                          msg.flagged ? 'text-rose-400' : ''
                        }`}
                        title="Report inaccuracy or flag for correction"
                      >
                        <Flag className="w-3.5 h-3.5" />
                        <span>{msg.flagged ? 'Reported' : 'Report'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading Spinner */}
        {loading && (
          <div className="flex gap-3 items-start">
            <div className="w-8 h-8 rounded-lg bg-violet-950 border border-violet-800 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-xs px-4 py-3 text-sm text-slate-400 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
              <span>Thinking and formulating step-by-step explanation...</span>
            </div>
          </div>
        )}

        {/* Error Callout */}
        {errorMessage && (
          <div className="p-4 bg-rose-950/60 border border-rose-800/80 rounded-xl flex items-start gap-3 text-rose-200 text-xs">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-rose-300">Tutoring Request Failed</p>
              <p>{errorMessage}</p>
              <button
                onClick={() => handleSend()}
                className="mt-1 inline-flex items-center gap-1 text-rose-200 underline hover:text-white"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Retry Question</span>
              </button>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Selected Image Preview before sending */}
      {selectedImage && (
        <div className="px-4 py-2 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-indigo-400" />
            <span>Image attached ({selectedImage.mimeType})</span>
          </div>
          <button
            onClick={() => setSelectedImage(null)}
            className="text-slate-400 hover:text-white cursor-pointer"
          >
            Remove
          </button>
        </div>
      )}

      {/* Quick Subject Suggestion Chips */}
      <div className="px-3 sm:px-4 py-2 bg-slate-950/70 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto text-[11px] no-scrollbar">
        <span className="text-slate-500 shrink-0 font-medium">Quick Prompts:</span>
        {[
          "Explain Kepler's 3 laws with formulas",
          "Solve simultaneous equations using Cramer's Rule",
          "Prove Basic Proportionality Theorem (BPT)",
          "Draw and explain Krebs Cycle in Science 2",
        ].map((promptText) => (
          <button
            key={promptText}
            type="button"
            onClick={() => {
              setInput(promptText);
              handleSend(promptText);
            }}
            className="px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white shrink-0 transition-colors cursor-pointer"
          >
            {promptText}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="p-3 sm:p-4 bg-slate-900/95 border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          {/* Homework Image Upload */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageSelect}
            accept="image/*"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            title="Attach photo of homework question"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask any ${subject} question (e.g., Explain Kepler's laws of planetary motion)...`}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
          />

          {/* Submit */}
          <button
            type="submit"
            disabled={(!input.trim() && !selectedImage) || loading}
            className="px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Ask</span>
          </button>
        </form>
      </div>
    </div>
  );
};
