import React, { useState, useEffect, useRef } from 'react';
import { storage } from '../services/storage';
import { QuickNote, UserProfile } from '../types';
import { 
  StickyNote, 
  Plus, 
  X, 
  Pin, 
  Trash2, 
  Copy, 
  Check, 
  Search, 
  Edit3, 
  ChevronDown, 
  ChevronUp, 
  Maximize2, 
  Minimize2,
  Sparkles,
  BookOpen
} from 'lucide-react';

interface QuickNotesPanelProps {
  currentSubject?: string;
}

export const QuickNotesPanel: React.FC<QuickNotesPanelProps> = ({ currentSubject }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [notes, setNotes] = useState<QuickNote[]>(() => storage.getQuickNotes());
  const [profile, setProfile] = useState<UserProfile>(() => storage.getUserProfile());

  // Form / Edit State
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [subject, setSubject] = useState<string>(
    currentSubject || profile.enrolledSubjects[0] || 'Mathematics Part 1'
  );
  const [selectedColor, setSelectedColor] = useState<'amber' | 'violet' | 'emerald' | 'rose' | 'cyan' | 'slate'>('amber');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync with storage events & profile updates
  useEffect(() => {
    const handleNotesUpdate = () => {
      setNotes(storage.getQuickNotes());
    };
    const handleProfileUpdate = () => {
      const updatedProfile = storage.getUserProfile();
      setProfile(updatedProfile);
    };

    window.addEventListener('nexora-quick-notes-updated', handleNotesUpdate);
    window.addEventListener('nexora-profile-updated', handleProfileUpdate);
    return () => {
      window.removeEventListener('nexora-quick-notes-updated', handleNotesUpdate);
      window.removeEventListener('nexora-profile-updated', handleProfileUpdate);
    };
  }, []);

  // Update default subject if currentSubject prop changes
  useEffect(() => {
    if (currentSubject) {
      setSubject(currentSubject);
    }
  }, [currentSubject]);

  const handleStartCreate = () => {
    setEditingNoteId(null);
    setTitle('');
    setContent('');
    setSubject(currentSubject || profile.enrolledSubjects[0] || 'General');
    setSelectedColor('amber');
    setIsCreating(true);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  };

  const handleStartEdit = (note: QuickNote) => {
    setEditingNoteId(note.id);
    setTitle(note.title);
    setContent(note.content);
    setSubject(note.subject || profile.enrolledSubjects[0] || 'General');
    setSelectedColor(note.color || 'amber');
    setIsCreating(true);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  };

  const handleCancelForm = () => {
    setIsCreating(false);
    setEditingNoteId(null);
    setTitle('');
    setContent('');
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    if (editingNoteId) {
      // Update existing
      storage.updateQuickNote(editingNoteId, {
        title: title.trim() || 'Untitled Note',
        content: content.trim(),
        subject,
        color: selectedColor,
      });
    } else {
      // Create new
      const newNote: QuickNote = {
        id: 'qnote_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        title: title.trim() || 'Untitled Note',
        content: content.trim(),
        subject,
        color: selectedColor,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        pinned: false,
      };
      storage.saveQuickNote(newNote);
    }

    setNotes(storage.getQuickNotes());
    setIsCreating(false);
    setEditingNoteId(null);
    setTitle('');
    setContent('');
  };

  const handleDeleteNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    storage.deleteQuickNote(id);
    setNotes(storage.getQuickNotes());
  };

  const handleTogglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const target = notes.find((n) => n.id === id);
    if (target) {
      storage.updateQuickNote(id, { pinned: !target.pinned });
      setNotes(storage.getQuickNotes());
    }
  };

  const handleCopyNote = (note: QuickNote, e: React.MouseEvent) => {
    e.stopPropagation();
    const textToCopy = `${note.title ? note.title + '\n' : ''}${note.content}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(note.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Color classes map
  const colorStyles: Record<string, { badge: string; border: string; bg: string }> = {
    amber: {
      badge: 'bg-amber-400/10 text-amber-300 border-amber-500/30',
      border: 'border-l-amber-400',
      bg: 'hover:bg-amber-950/20',
    },
    violet: {
      badge: 'bg-violet-400/10 text-violet-300 border-violet-500/30',
      border: 'border-l-violet-400',
      bg: 'hover:bg-violet-950/20',
    },
    emerald: {
      badge: 'bg-emerald-400/10 text-emerald-300 border-emerald-500/30',
      border: 'border-l-emerald-400',
      bg: 'hover:bg-emerald-950/20',
    },
    rose: {
      badge: 'bg-rose-400/10 text-rose-300 border-rose-500/30',
      border: 'border-l-rose-400',
      bg: 'hover:bg-rose-950/20',
    },
    cyan: {
      badge: 'bg-cyan-400/10 text-cyan-300 border-cyan-500/30',
      border: 'border-l-cyan-400',
      bg: 'hover:bg-cyan-950/20',
    },
    slate: {
      badge: 'bg-slate-800 text-slate-300 border-slate-700',
      border: 'border-l-slate-400',
      bg: 'hover:bg-slate-800/40',
    },
  };

  // Filter notes
  const filteredNotes = notes.filter((n) => {
    const matchesSearch = 
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (n.subject && n.subject.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesSubject = selectedSubjectFilter === 'all' || n.subject === selectedSubjectFilter;
    return matchesSearch && matchesSubject;
  });

  // Sort: pinned first, then newest updatedAt
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  return (
    <>
      {/* Floating Trigger Button (When closed) */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-violet-600 via-indigo-600 to-indigo-700 hover:from-violet-500 hover:to-indigo-600 text-white rounded-full shadow-2xl border border-violet-400/30 transition-all duration-300 hover:scale-105 cursor-pointer"
            title="Open Quick Notes"
          >
            <div className="relative">
              <StickyNote className="w-5 h-5 text-amber-300 group-hover:rotate-12 transition-transform" />
              {notes.length > 0 && (
                <span className="absolute -top-1 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[10px] font-bold text-slate-950">
                  {notes.length}
                </span>
              )}
            </div>
            <span className="text-xs sm:text-sm font-semibold tracking-wide">
              Quick Notes
            </span>
          </button>
        </div>
      )}

      {/* Floating Notes Panel */}
      {isOpen && (
        <div 
          className={`fixed z-40 transition-all duration-300 ${
            isMinimized
              ? 'bottom-6 right-6 w-72 sm:w-80 h-14'
              : 'bottom-4 sm:bottom-6 right-2 sm:right-6 w-[calc(100vw-1rem)] sm:w-96 max-h-[85vh] sm:max-h-[36rem] flex flex-col'
          } bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden`}
        >
          {/* Panel Header */}
          <div className="p-3.5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0 select-none">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-950 border border-indigo-700/50 text-amber-300">
                <StickyNote className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Quick Study Notes</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 font-mono">
                    {notes.length}
                  </span>
                </h3>
                {!isMinimized && (
                  <p className="text-[10px] text-slate-400">Jot thoughts during sessions</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-400">
              {!isMinimized && !isCreating && (
                <button
                  type="button"
                  onClick={handleStartCreate}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-amber-300 hover:text-white transition-colors cursor-pointer"
                  title="New Note"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
                title={isMinimized ? 'Expand' : 'Minimize'}
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
                title="Close Notes Panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Panel Body (when expanded) */}
          {!isMinimized && (
            <div className="flex-1 flex flex-col min-h-0 bg-slate-900/95 overflow-hidden">
              {/* Form State (Create or Edit Note) */}
              {isCreating ? (
                <form onSubmit={handleSaveNote} className="p-4 space-y-3 overflow-y-auto flex-1 text-left">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                      <span>{editingNoteId ? 'Edit Study Note' : 'New Quick Note'}</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleCancelForm}
                      className="text-[11px] text-slate-400 hover:text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>

                  {/* Title */}
                  <div>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Note Title or Chapter (Optional)"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                    />
                  </div>

                  {/* Content */}
                  <div>
                    <textarea
                      ref={textareaRef}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Jot down formulas, memory tricks, doubts, key concepts, or homework steps..."
                      rows={5}
                      required
                      className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none resize-none leading-relaxed"
                    />
                  </div>

                  {/* Subject and Color Selector Row */}
                  <div className="grid grid-cols-2 gap-2 text-left">
                    <div>
                      <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">
                        Subject
                      </label>
                      <select
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-[11px] text-slate-200 focus:outline-none cursor-pointer"
                      >
                        {profile.enrolledSubjects && profile.enrolledSubjects.length > 0 ? (
                          profile.enrolledSubjects.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))
                        ) : (
                          <option value="General">General</option>
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">
                        Tag Color
                      </label>
                      <div className="flex items-center gap-1.5 pt-1">
                        {(['amber', 'violet', 'emerald', 'rose', 'cyan', 'slate'] as const).map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setSelectedColor(c)}
                            className={`w-4 h-4 rounded-full transition-transform cursor-pointer ${
                              c === 'amber' ? 'bg-amber-400' :
                              c === 'violet' ? 'bg-violet-400' :
                              c === 'emerald' ? 'bg-emerald-400' :
                              c === 'rose' ? 'bg-rose-400' :
                              c === 'cyan' ? 'bg-cyan-400' : 'bg-slate-400'
                            } ${selectedColor === c ? 'scale-125 ring-2 ring-white/70' : 'opacity-70 hover:opacity-100'}`}
                            title={c}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Form Action Buttons */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={handleCancelForm}
                      className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-medium cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{editingNoteId ? 'Update' : 'Save Note'}</span>
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  {/* Search & Subject Filter Bar */}
                  <div className="p-3 border-b border-slate-800/80 space-y-2 shrink-0">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search quick notes..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <select
                        value={selectedSubjectFilter}
                        onChange={(e) => setSelectedSubjectFilter(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-slate-300 focus:outline-none cursor-pointer flex-1"
                      >
                        <option value="all">All Subjects ({notes.length})</option>
                        {profile.enrolledSubjects && profile.enrolledSubjects.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={handleStartCreate}
                        className="px-2.5 py-1 bg-violet-600/90 hover:bg-violet-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Note</span>
                      </button>
                    </div>
                  </div>

                  {/* Notes List */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-2.5 text-left">
                    {sortedNotes.length === 0 ? (
                      <div className="py-8 px-4 text-center space-y-2">
                        <StickyNote className="w-8 h-8 text-slate-600 mx-auto" />
                        <p className="text-xs text-slate-400 font-medium">
                          {searchQuery || selectedSubjectFilter !== 'all'
                            ? 'No notes match your search.'
                            : 'No notes yet.'}
                        </p>
                        <button
                          type="button"
                          onClick={handleStartCreate}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg text-xs font-medium cursor-pointer"
                        >
                          Create First Quick Note
                        </button>
                      </div>
                    ) : (
                      sortedNotes.map((note) => {
                        const style = colorStyles[note.color || 'amber'] || colorStyles.amber;
                        return (
                          <div
                            key={note.id}
                            className={`p-3 rounded-xl bg-slate-950 border border-slate-800/90 border-l-4 ${style.border} ${style.bg} transition-all space-y-2 group relative`}
                          >
                            {/* Card Top: Title, Subject & Actions */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-0.5 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {note.pinned && (
                                    <Pin className="w-3 h-3 text-amber-400 fill-amber-400/40 shrink-0" />
                                  )}
                                  <h4 className="text-xs font-bold text-white truncate">
                                    {note.title}
                                  </h4>
                                </div>
                                {note.subject && (
                                  <span className={`inline-block text-[10px] px-1.5 py-0.2 rounded border font-medium ${style.badge}`}>
                                    {note.subject}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  onClick={(e) => handleTogglePin(note.id, e)}
                                  className={`p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer ${
                                    note.pinned ? 'text-amber-400' : 'text-slate-400'
                                  }`}
                                  title={note.pinned ? 'Unpin Note' : 'Pin Note'}
                                >
                                  <Pin className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleCopyNote(note, e)}
                                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                                  title="Copy Note Text"
                                >
                                  {copiedId === note.id ? (
                                    <Check className="w-3 h-3 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleStartEdit(note)}
                                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                                  title="Edit Note"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteNote(note.id, e)}
                                  className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                                  title="Delete Note"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            {/* Card Content */}
                            <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap break-words">
                              {note.content}
                            </p>

                            {/* Timestamp */}
                            <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-900">
                              <span>
                                {new Date(note.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {new Date(note.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
};
