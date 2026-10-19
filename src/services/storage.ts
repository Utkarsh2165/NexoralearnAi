import {
  UserProfile,
  XpTransaction,
  QuizAttempt,
  StudyTask,
  StudyRoadmap,
  Flashcard,
  FlashcardDeck,
  StudyNote,
  QuickNote,
  SavedChatExchange,
  StudySessionLog,
  DailyActivityRecord,
  WeakTopicRecord,
} from '../types';
import { BRAND_CONFIG } from '../config/brand';

const STORAGE_KEYS = {
  USER_PROFILE: 'nexora_user_profile',
  XP_TRANSACTIONS: 'nexora_xp_transactions',
  QUIZ_ATTEMPTS: 'nexora_quiz_attempts',
  SAVED_ROADMAP: 'nexora_study_roadmap',
  FLASHCARD_DECKS: 'nexora_flashcard_decks',
  FLASHCARDS: 'nexora_flashcards',
  STUDY_NOTES: 'nexora_study_notes',
  QUICK_NOTES: 'nexora_quick_notes',
  SAVED_CHATS: 'nexora_saved_chats',
  STUDY_SESSIONS: 'nexora_study_sessions',
};

// Default initial student profile: Class 10 Maharashtra SSC (15 February 2027)
export const DEFAULT_GUEST_PROFILE: UserProfile = {
  id: 'guest_' + Math.random().toString(36).substring(2, 9),
  name: 'Scholar',
  isGuest: true,
  grade: 'Class 10 (10th Standard SSC)',
  board: 'Maharashtra State Board (MSBSHSE - SSC)',
  examination: 'Class 10 SSC Board Examination',
  targetExamDate: '2027-02-15',
  targetMarksPercentage: 95,
  currentMarksPercentage: 78,
  dailyStudyHours: 3.5,
  preferredLanguage: 'English',
  enrolledSubjects: [
    'Marathi',
    'English',
    'Hindi / Sanskrit',
    'Mathematics Part 1',
    'Mathematics Part 2',
    'Science and Technology Part 1',
    'Science and Technology Part 2',
    'History and Political Science',
    'Geography',
  ],
  createdAt: new Date().toISOString(),
  onboardingCompleted: true,
};

// Seed sample flashcards
const DEFAULT_DECKS: FlashcardDeck[] = [
  {
    id: 'deck-kepler',
    title: 'Keplerian Mechanics & Gravitation',
    subject: 'Physics',
    description: 'Kepler\'s three laws, planetary orbits, and gravitational dynamics.',
    cardCount: 4,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'deck-calculus',
    title: 'Differential Calculus & Rates',
    subject: 'Mathematics',
    description: 'Limits, derivatives, tangent gradients, and optimization rules.',
    cardCount: 3,
    createdAt: new Date().toISOString(),
  },
];

const DEFAULT_CARDS: Flashcard[] = [
  {
    id: 'card-k1',
    deckId: 'deck-kepler',
    front: 'State Kepler\'s First Law of Planetary Motion.',
    back: 'The orbit of a planet is an ellipse with the Sun located at one of the two foci ($r = \\frac{p}{1 + e\\cos\\theta}$).',
    subject: 'Physics',
    topic: 'Gravitation',
    intervalDays: 1,
    easeFactor: 2.5,
    repetitions: 0,
    nextReviewDate: new Date().toISOString().split('T')[0],
  },
  {
    id: 'card-k2',
    deckId: 'deck-kepler',
    front: 'What is Kepler\'s Second Law (Law of Equal Areas) in terms of angular momentum?',
    back: 'A line segment joining a planet and the Sun sweeps out equal areas during equal intervals of time ($dA/dt = L/(2m) = \\text{constant}$), conserving areal velocity.',
    subject: 'Physics',
    topic: 'Gravitation',
    intervalDays: 1,
    easeFactor: 2.5,
    repetitions: 0,
    nextReviewDate: new Date().toISOString().split('T')[0],
  },
  {
    id: 'card-k3',
    deckId: 'deck-kepler',
    front: 'What is Kepler\'s Third Law (Harmonic Law)?',
    back: 'The square of the orbital period of a planet is directly proportional to the cube of the semi-major axis of its orbit ($T^2 = \\frac{4\\pi^2}{GM} a^3$).',
    subject: 'Physics',
    topic: 'Gravitation',
    intervalDays: 2,
    easeFactor: 2.5,
    repetitions: 1,
    nextReviewDate: new Date().toISOString().split('T')[0],
  },
  {
    id: 'card-k4',
    deckId: 'deck-kepler',
    front: 'What is the point in a planet\'s orbit closest to the Sun called, and what is its speed there?',
    back: 'Perihelion (or Perigee for Earth orbits). The planet\'s orbital speed is at its maximum at perihelion.',
    subject: 'Physics',
    topic: 'Gravitation',
    intervalDays: 3,
    easeFactor: 2.5,
    repetitions: 1,
    nextReviewDate: new Date().toISOString().split('T')[0],
  },
  {
    id: 'card-c1',
    deckId: 'deck-calculus',
    front: 'What is the derivative of $f(x) = \\sin(2x)$ with respect to $x$?',
    back: 'Using the chain rule: $f\'(x) = 2\\cos(2x)$.',
    subject: 'Mathematics',
    topic: 'Calculus',
    intervalDays: 1,
    easeFactor: 2.5,
    repetitions: 0,
    nextReviewDate: new Date().toISOString().split('T')[0],
  },
];

// Seed sample starter quick notes
const DEFAULT_QUICK_NOTES: QuickNote[] = [
  {
    id: 'qnote-1',
    title: "Cramer's Rule Formula (Math 1)",
    content: "D = |a1 b1; a2 b2|, Dx = |c1 b1; c2 b2|, Dy = |a1 c1; a2 c2|. Then x = Dx/D, y = Dy/D (provided D != 0).",
    subject: "Mathematics Part 1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    pinned: true,
    color: 'amber',
  },
  {
    id: 'qnote-2',
    title: "Kepler's Law of Periods (Science 1)",
    content: "T² ∝ r³ -> (T1/T2)² = (r1/r2)³. Remember: orbital velocity v = √(GM/r), escape velocity v_esc = √(2GM/R).",
    subject: "Science and Technology Part 1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    pinned: false,
    color: 'violet',
  },
];

// Seed sample starter roadmap
// Seed sample starter roadmap tailored for Class 10 Maharashtra SSC
const DEFAULT_ROADMAP: StudyRoadmap = {
  id: 'starter-plan-ssc',
  title: 'Maharashtra SSC Class 10 Board Mastery Plan',
  overview: 'Curated revision schedule targeting Science 1 & 2, Mathematics Parts 1 & 2, and Social Sciences for 15 February 2027.',
  generatedAt: new Date().toISOString(),
  tasks: [
    {
      id: 'task-1',
      dayLabel: 'Day 1',
      subject: 'Science & Technology Part 1',
      chapter: 'Gravitation & Kepler\'s Laws',
      taskDescription: 'State and derive Kepler\'s three laws of planetary motion, and review Newton\'s Universal Law of Gravitation ($F = G\\frac{m_1 m_2}{r^2}$).',
      durationMinutes: 45,
      priority: 'high',
      completed: true,
      completedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      suggestedBreakMinutes: 10,
      practiceActivity: 'Solve 5 textbook numericals on escape velocity and free fall acceleration.',
    },
    {
      id: 'task-2',
      dayLabel: 'Day 1',
      subject: 'Mathematics Part 1 (Algebra)',
      chapter: 'Linear Equations in Two Variables',
      taskDescription: 'Solve simultaneous linear equations using Cramer\'s Determinant Method ($D, D_x, D_y$).',
      durationMinutes: 50,
      priority: 'high',
      completed: false,
      suggestedBreakMinutes: 10,
      practiceActivity: 'Practice 4 word problems on age and two-digit numbers in Math Lab.',
    },
    {
      id: 'task-3',
      dayLabel: 'Day 2',
      subject: 'Mathematics Part 2 (Geometry)',
      chapter: 'Similarity',
      taskDescription: 'Master Basic Proportionality Theorem (BPT / Thales Theorem) with formal proof and converse.',
      durationMinutes: 45,
      priority: 'high',
      completed: false,
      suggestedBreakMinutes: 10,
      practiceActivity: 'Draw triangles and verify area ratio theorem ($A_1/A_2 = b_1 h_1 / b_2 h_2$).',
    },
    {
      id: 'task-4',
      dayLabel: 'Day 2',
      subject: 'Science & Technology Part 2',
      chapter: 'Life Processes in Living Organisms Part 1',
      taskDescription: 'Draw and explain the step-by-step phases of cellular respiration: Glycolysis, TCA (Krebs) cycle, and ETC.',
      durationMinutes: 40,
      priority: 'medium',
      completed: false,
      suggestedBreakMinutes: 5,
      practiceActivity: 'Create revision flashcards on ATP production in aerobic respiration.',
    },
    {
      id: 'task-5',
      dayLabel: 'Day 3',
      subject: 'Geography',
      chapter: 'Physiography and Drainage',
      taskDescription: 'Compare the physiographic divisions of India (Himalayas, Deccan Plateau) and Brazil (Highlands, Amazon Basin).',
      durationMinutes: 40,
      priority: 'medium',
      completed: false,
      suggestedBreakMinutes: 10,
      practiceActivity: 'Mark key river basins (Ganga, Godavari, Amazon, Parana) on outline maps.',
    },
  ],
  weeklyHoursAllocation: [
    { subject: 'Science & Technology (Parts 1 & 2)', allocatedHours: 8 },
    { subject: 'Mathematics (Parts 1 & 2)', allocatedHours: 8.5 },
    { subject: 'History & Political Science / Geography', allocatedHours: 5 },
    { subject: 'Languages (Marathi, English, Hindi)', allocatedHours: 4.5 },
  ],
};

class StorageService {
  private safeGet<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      if (!item) return defaultValue;
      return JSON.parse(item);
    } catch {
      return defaultValue;
    }
  }

  private safeSet<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Error saving to localStorage key ${key}:`, e);
    }
  }

  // --- User Profile ---
  getUserProfile(): UserProfile {
    const profile = this.safeGet<UserProfile>(STORAGE_KEYS.USER_PROFILE, DEFAULT_GUEST_PROFILE);
    // Ensure all critical fields exist and migrate any outdated defaults
    if (!profile.examination) {
      profile.examination = 'Class 10 SSC Board Examination';
    }
    if (!profile.targetExamDate) {
      profile.targetExamDate = '2027-02-15';
    }
    if (!profile.enrolledSubjects || profile.enrolledSubjects.length === 0) {
      profile.enrolledSubjects = BRAND_CONFIG.defaultSscSubjects;
    }
    // Prevent unclosable overlay trap: ensure student is marked onboarded
    profile.onboardingCompleted = true;
    return profile;
  }

  saveUserProfile(profile: UserProfile): void {
    this.safeSet(STORAGE_KEYS.USER_PROFILE, profile);
    // Broadcast live event across all components in the app
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('nexora-profile-updated', { detail: profile }));
    }
  }

  // --- XP & Gamification ---
  getXpTransactions(): XpTransaction[] {
    return this.safeGet<XpTransaction[]>(STORAGE_KEYS.XP_TRANSACTIONS, [
      {
        id: 'init-xp',
        activityType: 'study_task',
        description: 'Completed initial orientation & study task',
        xpAmount: 10,
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        sourceId: 'task-1',
      },
    ]);
  }

  /**
   * Verified Anti-Abuse XP Awarding:
   * Rejects duplicate awards for identical sourceId (e.g. resubmitting same quiz attempt).
   */
  awardXp(
    activityType: XpTransaction['activityType'],
    xpAmount: number,
    description: string,
    sourceId?: string
  ): { awarded: boolean; totalXp: number; transaction?: XpTransaction } {
    if (xpAmount <= 0) return { awarded: false, totalXp: this.getTotalXp() };

    const transactions = this.getXpTransactions();

    if (sourceId && transactions.some((t) => t.sourceId === sourceId)) {
      // Deduplicate: XP already claimed for this specific action!
      return { awarded: false, totalXp: this.getTotalXp() };
    }

    const newTx: XpTransaction = {
      id: 'xp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      activityType,
      xpAmount,
      description,
      timestamp: new Date().toISOString(),
      sourceId,
    };

    transactions.push(newTx);
    this.safeSet(STORAGE_KEYS.XP_TRANSACTIONS, transactions);

    return {
      awarded: true,
      totalXp: this.getTotalXp(),
      transaction: newTx,
    };
  }

  getTotalXp(): number {
    const transactions = this.getXpTransactions();
    return transactions.reduce((sum, tx) => sum + (Number(tx.xpAmount) || 0), 0);
  }

  getUserLevelInfo() {
    const totalXp = this.getTotalXp();
    const levels = BRAND_CONFIG.levels;
    let currentLevel = levels[0];
    let nextLevel = levels[1];

    for (let i = 0; i < levels.length; i++) {
      if (totalXp >= levels[i].minXp) {
        currentLevel = levels[i];
        nextLevel = levels[i + 1] || null;
      }
    }

    const currentLevelMin = currentLevel.minXp;
    const nextLevelMin = nextLevel ? nextLevel.minXp : currentLevel.minXp + 500;
    const xpInLevel = totalXp - currentLevelMin;
    const xpRequiredForNext = nextLevelMin - currentLevelMin;
    const progressPercentage = Math.min(100, Math.round((xpInLevel / xpRequiredForNext) * 100));

    return {
      currentLevel: currentLevel.level,
      title: currentLevel.title,
      totalXp,
      nextLevelTitle: nextLevel ? nextLevel.title : 'Maximum Rank',
      progressPercentage,
      xpNeededForNext: Math.max(0, nextLevelMin - totalXp),
    };
  }

  // --- Daily Streak Calculation ---
  getStreakInfo(): { currentStreak: number; longestStreak: number; activeDays: string[] } {
    const attempts = this.getQuizAttempts();
    const tasks = this.getRoadmap().tasks.filter((t) => t.completed && t.completedAt);
    const sessions = this.getStudySessions();

    const dateSet = new Set<string>();

    attempts.forEach((a) => {
      dateSet.add(a.completedAt.split('T')[0]);
    });
    tasks.forEach((t) => {
      if (t.completedAt) dateSet.add(t.completedAt.split('T')[0]);
    });
    sessions.forEach((s) => {
      dateSet.add(s.completedAt.split('T')[0]);
    });

    const dates = Array.from(dateSet).sort().reverse();
    if (dates.length === 0) {
      return { currentStreak: 0, longestStreak: 0, activeDays: [] };
    }

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    let currentStreak = 0;
    let checkDate = new Date();

    // Check if studied today, if not check if studied yesterday
    if (!dateSet.has(today)) {
      if (!dateSet.has(yesterday)) {
        currentStreak = 0;
      } else {
        checkDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      }
    }

    if (dateSet.has(today) || dateSet.has(yesterday)) {
      while (true) {
        const dStr = checkDate.toISOString().split('T')[0];
        if (dateSet.has(dStr)) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    // Longest streak
    let longestStreak = currentStreak;
    let tempStreak = 0;
    const chronological = Array.from(dateSet).sort();
    for (let i = 0; i < chronological.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prev = new Date(chronological[i - 1]);
        const curr = new Date(chronological[i]);
        const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 3600 * 24));
        if (diffDays === 1) {
          tempStreak++;
        } else if (diffDays > 1) {
          tempStreak = 1;
        }
      }
      if (tempStreak > longestStreak) longestStreak = tempStreak;
    }

    return {
      currentStreak,
      longestStreak: Math.max(longestStreak, currentStreak),
      activeDays: Array.from(dateSet),
    };
  }

  // --- Quiz Attempts ---
  getQuizAttempts(): QuizAttempt[] {
    return this.safeGet<QuizAttempt[]>(STORAGE_KEYS.QUIZ_ATTEMPTS, []);
  }

  saveQuizAttempt(attempt: QuizAttempt): void {
    const attempts = this.getQuizAttempts();
    attempts.unshift(attempt);
    this.safeSet(STORAGE_KEYS.QUIZ_ATTEMPTS, attempts);

    // Verified XP award for completing quiz (+15 XP) with deduplication
    this.awardXp('quiz_completed', BRAND_CONFIG.xpRewards.quizCompleted, `Completed quiz: ${attempt.quizTitle}`, attempt.id);
  }

  // --- Weak Topics Extraction ---
  getWeakTopics(): WeakTopicRecord[] {
    const attempts = this.getQuizAttempts();
    const topicMap: Record<string, { subject: string; mistakes: number; total: number; lastDate: string }> = {};

    attempts.forEach((att) => {
      const key = `${att.subject}:::${att.topic}`;
      if (!topicMap[key]) {
        topicMap[key] = {
          subject: att.subject,
          mistakes: 0,
          total: 0,
          lastDate: att.completedAt,
        };
      }
      topicMap[key].total += att.totalQuestions;
      topicMap[key].mistakes += (att.totalQuestions - att.correctCount);
      if (att.completedAt > topicMap[key].lastDate) {
        topicMap[key].lastDate = att.completedAt;
      }
    });

    const list: WeakTopicRecord[] = [];
    Object.entries(topicMap).forEach(([key, val]) => {
      const topic = key.split(':::')[1];
      const accuracyRate = val.total > 0 ? Math.round(((val.total - val.mistakes) / val.total) * 100) : 100;
      if (accuracyRate < 75 || val.mistakes >= 2) {
        list.push({
          subject: val.subject,
          topic,
          incorrectAttemptsCount: val.mistakes,
          totalAttemptsCount: val.total,
          accuracyRate,
          lastPracticed: val.lastDate,
        });
      }
    });

    return list.sort((a, b) => a.accuracyRate - b.accuracyRate);
  }

  // --- Study Roadmap ---
  getRoadmap(): StudyRoadmap {
    return this.safeGet<StudyRoadmap>(STORAGE_KEYS.SAVED_ROADMAP, DEFAULT_ROADMAP);
  }

  saveRoadmap(roadmap: StudyRoadmap): void {
    this.safeSet(STORAGE_KEYS.SAVED_ROADMAP, roadmap);
  }

  toggleTaskCompletion(taskId: string): { task?: StudyTask; xpAwarded: boolean } {
    const roadmap = this.getRoadmap();
    const task = roadmap.tasks.find((t) => t.id === taskId);
    if (!task) return { xpAwarded: false };

    task.completed = !task.completed;
    let xpAwarded = false;

    if (task.completed) {
      task.completedAt = new Date().toISOString();
      const res = this.awardXp(
        'study_task',
        BRAND_CONFIG.xpRewards.studyTaskCompleted,
        `Finished study task: ${task.chapter}`,
        task.id
      );
      xpAwarded = res.awarded;
    } else {
      task.completedAt = undefined;
    }

    this.saveRoadmap(roadmap);
    return { task, xpAwarded };
  }

  addTask(task: Omit<StudyTask, 'id'>): StudyTask {
    const roadmap = this.getRoadmap();
    const newTask: StudyTask = {
      ...task,
      id: 'task_' + Date.now(),
    };
    roadmap.tasks.push(newTask);
    this.saveRoadmap(roadmap);
    return newTask;
  }

  // --- Flashcards ---
  getFlashcardDecks(): FlashcardDeck[] {
    return this.safeGet<FlashcardDeck[]>(STORAGE_KEYS.FLASHCARD_DECKS, DEFAULT_DECKS);
  }

  saveFlashcardDecks(decks: FlashcardDeck[]): void {
    this.safeSet(STORAGE_KEYS.FLASHCARD_DECKS, decks);
  }

  getFlashcards(): Flashcard[] {
    return this.safeGet<Flashcard[]>(STORAGE_KEYS.FLASHCARDS, DEFAULT_CARDS);
  }

  saveFlashcards(cards: Flashcard[]): void {
    this.safeSet(STORAGE_KEYS.FLASHCARDS, cards);
  }

  recordCardReview(cardId: string, rating: 'again' | 'good' | 'easy'): Flashcard | null {
    const cards = this.getFlashcards();
    const card = cards.find((c) => c.id === cardId);
    if (!card) return null;

    card.lastReviewedAt = new Date().toISOString();
    let newInterval = card.intervalDays;
    let newEase = card.easeFactor;

    if (rating === 'again') {
      newInterval = 1;
      newEase = Math.max(1.3, card.easeFactor - 0.2);
    } else if (rating === 'good') {
      newInterval = Math.max(1, Math.round(card.intervalDays * card.easeFactor));
      card.repetitions += 1;
    } else {
      // easy
      newInterval = Math.max(2, Math.round(card.intervalDays * (card.easeFactor + 0.3)));
      newEase = Math.min(3.0, card.easeFactor + 0.15);
      card.repetitions += 1;
    }

    card.intervalDays = newInterval;
    card.easeFactor = newEase;

    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + newInterval);
    card.nextReviewDate = nextDate.toISOString().split('T')[0];

    this.saveFlashcards(cards);
    this.awardXp('flashcard_review', BRAND_CONFIG.xpRewards.flashcardReviewed, `Reviewed flashcard on ${card.topic}`);

    return card;
  }

  // --- Study Notes ---
  getStudyNotes(): StudyNote[] {
    return this.safeGet<StudyNote[]>(STORAGE_KEYS.STUDY_NOTES, []);
  }

  saveStudyNote(note: StudyNote): void {
    const notes = this.getStudyNotes();
    const existingIndex = notes.findIndex((n) => n.id === note.id);
    if (existingIndex >= 0) {
      notes[existingIndex] = note;
    } else {
      notes.unshift(note);
    }
    this.safeSet(STORAGE_KEYS.STUDY_NOTES, notes);
  }

  deleteStudyNote(noteId: string): void {
    const notes = this.getStudyNotes().filter((n) => n.id !== noteId);
    this.safeSet(STORAGE_KEYS.STUDY_NOTES, notes);
  }

  // --- Quick Notes (Floating Panel) ---
  getQuickNotes(): QuickNote[] {
    return this.safeGet<QuickNote[]>(STORAGE_KEYS.QUICK_NOTES, DEFAULT_QUICK_NOTES);
  }

  saveQuickNote(note: QuickNote): void {
    const notes = this.getQuickNotes();
    const existingIndex = notes.findIndex((n) => n.id === note.id);
    if (existingIndex >= 0) {
      notes[existingIndex] = { ...note, updatedAt: new Date().toISOString() };
    } else {
      notes.unshift(note);
    }
    this.safeSet(STORAGE_KEYS.QUICK_NOTES, notes);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('nexora-quick-notes-updated', { detail: notes }));
    }
  }

  deleteQuickNote(noteId: string): void {
    const notes = this.getQuickNotes().filter((n) => n.id !== noteId);
    this.safeSet(STORAGE_KEYS.QUICK_NOTES, notes);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('nexora-quick-notes-updated', { detail: notes }));
    }
  }

  updateQuickNote(noteId: string, updates: Partial<QuickNote>): void {
    const notes = this.getQuickNotes();
    const target = notes.find((n) => n.id === noteId);
    if (target) {
      Object.assign(target, updates, { updatedAt: new Date().toISOString() });
      this.safeSet(STORAGE_KEYS.QUICK_NOTES, notes);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('nexora-quick-notes-updated', { detail: notes }));
      }
    }
  }

  // --- Saved AI Chats ---
  getSavedChats(): SavedChatExchange[] {
    return this.safeGet<SavedChatExchange[]>(STORAGE_KEYS.SAVED_CHATS, []);
  }

  saveChatExchange(exchange: SavedChatExchange): void {
    const chats = this.getSavedChats();
    chats.unshift(exchange);
    this.safeSet(STORAGE_KEYS.SAVED_CHATS, chats);
  }

  // --- Study Sessions (Focus Timer) ---
  getStudySessions(): StudySessionLog[] {
    return this.safeGet<StudySessionLog[]>(STORAGE_KEYS.STUDY_SESSIONS, [
      {
        id: 'init-session',
        durationMinutes: 25,
        subject: 'Physics',
        completedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      },
    ]);
  }

  recordStudySession(durationMinutes: number, subject?: string): void {
    const sessions = this.getStudySessions();
    const session: StudySessionLog = {
      id: 'session_' + Date.now(),
      durationMinutes,
      subject,
      completedAt: new Date().toISOString(),
    };
    sessions.unshift(session);
    this.safeSet(STORAGE_KEYS.STUDY_SESSIONS, sessions);

    this.awardXp(
      'focus_session',
      BRAND_CONFIG.xpRewards.focusSessionCompleted,
      `Completed ${durationMinutes}m focus study session on ${subject || 'general topics'}`,
      session.id
    );
  }

  // --- Aggregated Analytics ---
  getWeeklyActivity(): DailyActivityRecord[] {
    const dates: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }

    const sessions = this.getStudySessions();
    const tasks = this.getRoadmap().tasks.filter((t) => t.completed && t.completedAt);
    const quizzes = this.getQuizAttempts();
    const xpList = this.getXpTransactions();

    return dates.map((date) => {
      const minutesStudied = sessions
        .filter((s) => s.completedAt.startsWith(date))
        .reduce((sum, s) => sum + s.durationMinutes, 0);

      const tasksCompleted = tasks.filter((t) => t.completedAt && t.completedAt.startsWith(date)).length;
      const quizzesTaken = quizzes.filter((q) => q.completedAt.startsWith(date)).length;
      const xpEarned = xpList
        .filter((x) => x.timestamp.startsWith(date))
        .reduce((sum, x) => sum + x.xpAmount, 0);

      return {
        date,
        minutesStudied,
        tasksCompleted,
        quizzesTaken,
        xpEarned,
      };
    });
  }

  // --- Data Export & Import ---
  exportAllData(): string {
    const payload = {
      version: BRAND_CONFIG.version,
      exportedAt: new Date().toISOString(),
      profile: this.getUserProfile(),
      xpTransactions: this.getXpTransactions(),
      quizAttempts: this.getQuizAttempts(),
      roadmap: this.getRoadmap(),
      flashcardDecks: this.getFlashcardDecks(),
      flashcards: this.getFlashcards(),
      studyNotes: this.getStudyNotes(),
      quickNotes: this.getQuickNotes(),
      savedChats: this.getSavedChats(),
      studySessions: this.getStudySessions(),
    };
    return JSON.stringify(payload, null, 2);
  }

  importAllData(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.profile) this.safeSet(STORAGE_KEYS.USER_PROFILE, parsed.profile);
      if (parsed.xpTransactions) this.safeSet(STORAGE_KEYS.XP_TRANSACTIONS, parsed.xpTransactions);
      if (parsed.quizAttempts) this.safeSet(STORAGE_KEYS.QUIZ_ATTEMPTS, parsed.quizAttempts);
      if (parsed.roadmap) this.safeSet(STORAGE_KEYS.SAVED_ROADMAP, parsed.roadmap);
      if (parsed.flashcardDecks) this.safeSet(STORAGE_KEYS.FLASHCARD_DECKS, parsed.flashcardDecks);
      if (parsed.flashcards) this.safeSet(STORAGE_KEYS.FLASHCARDS, parsed.flashcards);
      if (parsed.studyNotes) this.safeSet(STORAGE_KEYS.STUDY_NOTES, parsed.studyNotes);
      if (parsed.quickNotes) this.safeSet(STORAGE_KEYS.QUICK_NOTES, parsed.quickNotes);
      if (parsed.savedChats) this.safeSet(STORAGE_KEYS.SAVED_CHATS, parsed.savedChats);
      if (parsed.studySessions) this.safeSet(STORAGE_KEYS.STUDY_SESSIONS, parsed.studySessions);
      return true;
    } catch (e) {
      console.error('Failed to parse imported data:', e);
      return false;
    }
  }

  clearAllData(): void {
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
  }
}

export const storage = new StorageService();
