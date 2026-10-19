/**
 * Data Model Types for Nexora Learn AI
 */

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  isGuest: boolean;
  avatar?: string;
  grade: string;
  board: string;
  examination: string;
  targetExamDate: string;
  targetMarksPercentage: number;
  currentMarksPercentage: number;
  dailyStudyHours: number;
  preferredLanguage: string;
  enrolledSubjects: string[];
  createdAt: string;
  onboardingCompleted: boolean;
}

export interface XpTransaction {
  id: string;
  activityType: 'study_task' | 'quiz_completed' | 'focus_session' | 'flashcard_review' | 'math_solve';
  description: string;
  xpAmount: number;
  timestamp: string;
  sourceId?: string; // used for deduplication (e.g. quizAttemptId)
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  topicSubcategory?: string;
}

export interface QuizDefinition {
  id: string;
  title: string;
  subject: string;
  topic: string;
  grade?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  format: 'mcq' | 'true_false' | 'short';
  timeLimitSeconds?: number;
  negativeMarking: boolean;
  questions: QuizQuestion[];
  createdAt: string;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  quizTitle: string;
  subject: string;
  topic: string;
  totalQuestions: number;
  correctCount: number;
  scorePercentage: number;
  answers: Record<string, string>; // questionId -> selectedOption
  mistakes: Array<{
    questionId: string;
    question: string;
    userAnswer: string;
    correctAnswer: string;
    explanation: string;
  }>;
  completedAt: string;
  durationSeconds: number;
  awardedXp: number;
}

export interface StudyTask {
  id: string;
  dayLabel: string;
  subject: string;
  chapter: string;
  taskDescription: string;
  durationMinutes: number;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
  completedAt?: string;
  suggestedBreakMinutes?: number;
  practiceActivity?: string;
}

export interface StudyRoadmap {
  id: string;
  title: string;
  overview: string;
  generatedAt: string;
  tasks: StudyTask[];
  weeklyHoursAllocation: Array<{
    subject: string;
    allocatedHours: number;
  }>;
  revisionMilestones?: Array<{
    milestone: string;
    targetDay: string;
    focusSubject: string;
  }>;
}

export interface Flashcard {
  id: string;
  deckId: string;
  front: string;
  back: string;
  subject: string;
  topic: string;
  intervalDays: number;
  easeFactor: number;
  repetitions: number;
  lastReviewedAt?: string;
  nextReviewDate: string;
}

export interface FlashcardDeck {
  id: string;
  title: string;
  subject: string;
  description: string;
  cardCount: number;
  createdAt: string;
}

export interface QuickNote {
  id: string;
  title: string;
  content: string;
  subject?: string;
  createdAt: string;
  updatedAt: string;
  pinned?: boolean;
  color?: 'violet' | 'amber' | 'emerald' | 'rose' | 'cyan' | 'slate';
}

export interface StudyNote {
  id: string;
  title: string;
  subject: string;
  summaryParagraphs: string[];
  keyDefinitions: Array<{ term: string; definition: string }>;
  formulasOrLaws: Array<{ name: string; formula: string; application: string }>;
  highYieldQA: Array<{ question: string; answer: string }>;
  savedAt: string;
}

export interface SavedChatExchange {
  id: string;
  subject: string;
  question: string;
  answer: string;
  savedAt: string;
  bookmarked: boolean;
}

export interface StudySessionLog {
  id: string;
  durationMinutes: number;
  subject?: string;
  completedAt: string;
}

export interface DailyActivityRecord {
  date: string; // YYYY-MM-DD
  minutesStudied: number;
  tasksCompleted: number;
  quizzesTaken: number;
  xpEarned: number;
}

export interface WeakTopicRecord {
  subject: string;
  topic: string;
  incorrectAttemptsCount: number;
  totalAttemptsCount: number;
  accuracyRate: number;
  lastPracticed: string;
}
