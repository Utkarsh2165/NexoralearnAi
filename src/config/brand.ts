/**
 * Nexora Learn AI - Brand & Configuration Constants
 * Allows easy re-branding and configuration from a single centralized file.
 */

export const BRAND_CONFIG = {
  name: "Nexora Learn AI",
  shortName: "Nexora",
  tagline: "Learn Smarter. Improve Every Day.",
  version: "1.0.0",
  contactEmail: "support@nexora.ai",
  
  // Available grade levels (Classes 1–12 supported)
  grades: [
    "Class 1",
    "Class 2",
    "Class 3",
    "Class 4",
    "Class 5",
    "Class 6",
    "Class 7",
    "Class 8",
    "Class 9",
    "Class 10 (10th Standard SSC)",
    "Class 11 (FYJC / 11th Standard)",
    "Class 12 (HSC / 12th Standard)",
    "Undergraduate / Degree College",
    "Competitive Examination Aspirant",
  ],

  // Academic boards and competitive examinations
  boards: [
    "Maharashtra State Board (MSBSHSE - SSC)",
    "Maharashtra State Board (MSBSHSE - HSC)",
    "CBSE (Central Board of Secondary Education)",
    "ICSE / ISC (CISCE)",
    "State Board (Other State Boards)",
    "IB (International Baccalaureate)",
    "Cambridge IGCSE / A-Levels",
    "Competitive Entrance (JEE / NEET / MHT-CET)",
    "General Lifelong Learning",
  ],

  // Common examinations
  examinations: [
    "Class 10 SSC Board Examination",
    "Class 12 HSC Board Examination",
    "CBSE Class 10 Board Examination",
    "CBSE Class 12 Board Examination",
    "ICSE Class 10 Board Examination",
    "School Annual Examination",
    "MHT-CET Entrance Examination",
    "JEE Main & Advanced",
    "NEET Examination",
  ],

  // Complete Maharashtra SSC and standard academic subjects
  subjects: [
    "Marathi",
    "English",
    "Hindi / Sanskrit",
    "Mathematics Part 1",
    "Mathematics Part 2",
    "Science and Technology Part 1",
    "Science and Technology Part 2",
    "History and Political Science",
    "Geography",
    "Physics",
    "Chemistry",
    "Biology",
    "Mathematics",
    "Computer Science",
    "Economics & Commerce",
  ],

  // Default Maharashtra SSC core subjects (Class 10)
  defaultSscSubjects: [
    "Marathi",
    "English",
    "Hindi / Sanskrit",
    "Mathematics Part 1",
    "Mathematics Part 2",
    "Science and Technology Part 1",
    "Science and Technology Part 2",
    "History and Political Science",
    "Geography",
  ],

  // Supported explanation languages
  languages: [
    { code: "English", label: "English" },
    { code: "Hindi", label: "हिंदी (Hindi)" },
    { code: "Marathi", label: "मराठी (Marathi)" },
  ],

  // Gamification XP Values (Configurable anti-abuse values)
  xpRewards: {
    studyTaskCompleted: 10,
    quizCompleted: 15,
    focusSessionCompleted: 10,
    flashcardReviewed: 2,
    mathSolved: 5,
  },

  // Level thresholds (XP required to reach each level)
  levels: [
    { level: 1, title: "Apprentice Scholar", minXp: 0 },
    { level: 2, title: "Curious Learner", minXp: 50 },
    { level: 3, title: "Dedicated Student", minXp: 150 },
    { level: 4, title: "Concept Master", minXp: 300 },
    { level: 5, title: "Academic Ace", minXp: 550 },
    { level: 6, title: "Grand Polymath", minXp: 900 },
  ],

  // Asset image paths generated for this app
  images: {
    hero: "/src/assets/images/hero_academic_learning_1792347489489.jpg",
    mathLab: "/src/assets/images/topic_mathematics_lab_1792347489819.jpg",
    physicsCosmos: "/src/assets/images/topic_physics_cosmos_1792347491094.jpg",
    biologyCells: "/src/assets/images/topic_biology_cells_1792347490718.jpg",
  },
};
