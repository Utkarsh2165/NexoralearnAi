import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '15mb' }));

// Initialize Google Gemini SDK on the server only
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in the server environment.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// 1. AI Study Tutor Chat Endpoint
app.post('/api/ai/chat', async (req: Request, res: Response) => {
  try {
    const { message, conversationHistory, subject, mode, language, image } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Valid message prompt is required.' });
      return;
    }

    const ai = getGeminiClient();

    const systemInstruction = `You are Nexora AI, a world-class academic tutor and personalized learning mentor.
CRITICAL MANDATE:
1. Provide highly accurate, step-by-step explanations directly addressing the student's exact query.
2. Under no circumstance return unrelated topics (for example: if asked about Kepler's laws of planetary motion, explain Kepler's three laws; do NOT discuss Newton or Ohm or unrelated topics).
3. If the student query is ambiguous, ask for clarification politely before assuming.
4. Format mathematical and scientific formulas using standard LaTeX enclosed in dollar signs (e.g. $E = mc^2$ or $$\\int_0^1 x^2 dx$$).
5. Preferred language: ${language || 'English'} (support English, Hindi, and Marathi naturally as requested).
6. Tone/Style: ${mode === 'concise' ? 'Concise & bulleted' : mode === 'detailed' ? 'In-depth with deep context' : mode === 'exam' ? 'Exam-oriented with marking tips & model answer format' : 'Simple, intuitive analogy (ELI5)'}.
7. Academic Subject Context: ${subject || 'General Academic Studies'}.
8. Structure your response with clear headings, clean explanations, a practical example, and 1 quick check-for-understanding question at the end.`;

    const contents: any[] = [];

    // Include recent conversation context (last 6 exchanges) to prevent topic drift
    if (Array.isArray(conversationHistory)) {
      conversationHistory.slice(-6).forEach((item: any) => {
        if (item.role === 'user' || item.role === 'model') {
          contents.push({
            role: item.role,
            parts: [{ text: String(item.text).slice(0, 2000) }],
          });
        }
      });
    }

    // Current turn parts
    const currentParts: any[] = [];
    if (image && image.data && image.mimeType) {
      currentParts.push({
        inlineData: {
          mimeType: image.mimeType,
          data: image.data.replace(/^data:[^;]+;base64,/, ''),
        },
      });
    }
    currentParts.push({ text: message });

    contents.push({
      role: 'user',
      parts: currentParts,
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.3, // Low temperature for high academic precision
      },
    });

    const reply = response.text || 'I could not generate an answer. Please rephrase your question.';
    res.json({ reply });
  } catch (err: any) {
    console.error('Error in /api/ai/chat:', err);
    res.status(500).json({
      error: err.message || 'Failed to process AI tutoring request.',
    });
  }
});

// 2. AI Quiz Generator Endpoint
app.post('/api/ai/quiz', async (req: Request, res: Response) => {
  try {
    const { subject, grade, topic, difficulty, count = 5, format = 'mcq' } = req.body;

    if (!subject || !topic) {
      res.status(400).json({ error: 'Subject and topic are required.' });
      return;
    }

    const ai = getGeminiClient();

    const prompt = `Generate a rigorous academic quiz for:
Subject: ${subject}
Grade/Level: ${grade || 'High School / Secondary'}
Topic: ${topic}
Difficulty: ${difficulty || 'medium'}
Question Count: ${Math.min(Math.max(Number(count) || 5, 1), 10)}
Format: ${format}

CRITICAL RULES:
1. Every question must be directly related to the specified topic "${topic}".
2. The correctAnswer must strictly match one of the options (for MCQ) and must be logically consistent with the explanation.
3. The explanation must thoroughly detail why the correct answer is right and why distractors are incorrect.
4. Include LaTeX for equations if applicable (enclosed in $...$).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            quizTitle: { type: Type.STRING },
            subject: { type: Type.STRING },
            topic: { type: Type.STRING },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  question: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  correctAnswer: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                  topicSubcategory: { type: Type.STRING },
                },
                required: ['id', 'question', 'options', 'correctAnswer', 'explanation'],
              },
            },
          },
          required: ['quizTitle', 'subject', 'topic', 'questions'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (err: any) {
    console.error('Error in /api/ai/quiz:', err);
    res.status(500).json({ error: err.message || 'Failed to generate quiz.' });
  }
});

// 3. Personalized Study Roadmap Endpoint
app.post('/api/ai/roadmap', async (req: Request, res: Response) => {
  try {
    const { classLevel, board, examDate, currentMarks, targetMarks, dailyHours, subjects, weakTopics } = req.body;

    const ai = getGeminiClient();

    const prompt = `Generate a realistic, adaptive educational study roadmap for a student:
- Level/Class: ${classLevel || '10th/12th Grade'}
- Board/Exam: ${board || 'CBSE / General'}
- Target Examination Date: ${examDate || 'Next 60 Days'}
- Current Marks Level: ${currentMarks || '65%'} -> Target Marks Goal: ${targetMarks || '90%'}
- Available Daily Study Time: ${dailyHours || '3'} hours/day
- Core Subjects: ${Array.isArray(subjects) ? subjects.join(', ') : 'Mathematics, Science, English'}
- Known Weak Areas to prioritize: ${Array.isArray(weakTopics) && weakTopics.length ? weakTopics.join(', ') : 'None specified yet'}

CRITICAL GUIDELINES:
- Build a grounded schedule with sensible study sessions, interleaved revision, and periodic self-testing.
- Do NOT make unrealistic claims or guarantees of becoming a topper.
- Group into structured daily tasks with clear chapter names, action verbs, duration in minutes, priority (high, medium, low), and revision dates.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            roadmapTitle: { type: Type.STRING },
            overview: { type: Type.STRING },
            weeklyHoursAllocation: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  subject: { type: Type.STRING },
                  allocatedHours: { type: Type.NUMBER },
                },
                required: ['subject', 'allocatedHours'],
              },
            },
            dailyTasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  dayLabel: { type: Type.STRING },
                  subject: { type: Type.STRING },
                  chapter: { type: Type.STRING },
                  taskDescription: { type: Type.STRING },
                  durationMinutes: { type: Type.INTEGER },
                  priority: { type: Type.STRING },
                  suggestedBreakMinutes: { type: Type.INTEGER },
                  practiceActivity: { type: Type.STRING },
                },
                required: ['id', 'dayLabel', 'subject', 'chapter', 'taskDescription', 'durationMinutes', 'priority'],
              },
            },
            revisionMilestones: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  milestone: { type: Type.STRING },
                  targetDay: { type: Type.STRING },
                  focusSubject: { type: Type.STRING },
                },
                required: ['milestone', 'targetDay', 'focusSubject'],
              },
            },
          },
          required: ['roadmapTitle', 'overview', 'dailyTasks', 'weeklyHoursAllocation'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (err: any) {
    console.error('Error in /api/ai/roadmap:', err);
    res.status(500).json({ error: err.message || 'Failed to generate study roadmap.' });
  }
});

// 4. Answer Checker & Rubric Evaluator Endpoint
app.post('/api/ai/check-answer', async (req: Request, res: Response) => {
  try {
    const { question, studentAnswer, board, targetMarks, image } = req.body;

    if (!question && !image) {
      res.status(400).json({ error: 'Question or question image is required.' });
      return;
    }

    const ai = getGeminiClient();

    const parts: any[] = [];
    if (image && image.data && image.mimeType) {
      parts.push({
        inlineData: {
          mimeType: image.mimeType,
          data: image.data.replace(/^data:[^;]+;base64,/, ''),
        },
      });
    }

    parts.push({
      text: `Evaluate this student's written response objectively against academic marking standards:
Question: ${question || 'Refer to the attached image'}
Student Answer: ${studentAnswer || 'Refer to handwritten answer in the image'}
Target Board/Standard: ${board || 'Standard High School Examination'}
Maximum Marks for Question: ${targetMarks || '5'}

Provide a rigorous educational assessment:
1. What was done correctly and deserves credit.
2. What mistakes, omissions, or misconceptions exist.
3. Rubric breakdown (Conceptual Understanding, Accuracy/Calculations, Presentation/Terminology).
4. Estimated score (Clearly note this is an AI estimate for learning purposes).
5. Exemplar full-marks model answer.`,
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            estimatedScore: { type: Type.NUMBER },
            maxScore: { type: Type.NUMBER },
            overallFeedback: { type: Type.STRING },
            strengths: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            mistakesOrMissingPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            rubricBreakdown: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  criterion: { type: Type.STRING },
                  scoreAwarded: { type: Type.NUMBER },
                  maxCriterionScore: { type: Type.NUMBER },
                  remark: { type: Type.STRING },
                },
                required: ['criterion', 'scoreAwarded', 'maxCriterionScore', 'remark'],
              },
            },
            improvedModelAnswer: { type: Type.STRING },
            recommendedRevisionTopic: { type: Type.STRING },
          },
          required: [
            'estimatedScore',
            'maxScore',
            'overallFeedback',
            'strengths',
            'mistakesOrMissingPoints',
            'improvedModelAnswer',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (err: any) {
    console.error('Error in /api/ai/check-answer:', err);
    res.status(500).json({ error: err.message || 'Failed to evaluate answer.' });
  }
});

// 5. Equation Solver & Step-by-Step Math Explainer Endpoint
app.post('/api/ai/solve-math', async (req: Request, res: Response) => {
  try {
    const { equation, topic = 'Algebra' } = req.body;

    if (!equation) {
      res.status(400).json({ error: 'Equation or mathematical expression is required.' });
      return;
    }

    const ai = getGeminiClient();

    const prompt = `Solve and mathematically analyze this problem:
Problem: "${equation}"
Topic: "${topic}"

Requirements:
1. Provide accurate step-by-step mathematical reasoning.
2. Verify the solution by substituting back into original problem.
3. State domain restrictions (e.g. denominator != 0, radicand >= 0) and whether zero, unique, or multiple solutions exist.
4. If graphable in form y = f(x), provide a JavaScript-evaluable math expression string for plotting (e.g. "2*x + 3", "x*x - 4", "Math.sin(x)").
5. Format steps with LaTeX formatted equations.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            problem: { type: Type.STRING },
            classification: { type: Type.STRING },
            finalAnswer: { type: Type.STRING },
            steps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  stepNumber: { type: Type.INTEGER },
                  title: { type: Type.STRING },
                  mathExpression: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                },
                required: ['stepNumber', 'title', 'mathExpression', 'explanation'],
              },
            },
            verification: { type: Type.STRING },
            domainRestrictions: { type: Type.STRING },
            plotFunctionJs: { type: Type.STRING },
            keyConcepts: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['problem', 'classification', 'finalAnswer', 'steps', 'verification'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (err: any) {
    console.error('Error in /api/ai/solve-math:', err);
    res.status(500).json({ error: err.message || 'Failed to solve equation.' });
  }
});

// 6. Notes Summarizer & Concept Extractor Endpoint
app.post('/api/ai/summarize', async (req: Request, res: Response) => {
  try {
    const { subject, chapterTitle, rawText, type = 'summary' } = req.body;

    if (!chapterTitle && !rawText) {
      res.status(400).json({ error: 'Chapter title or source text is required.' });
      return;
    }

    const ai = getGeminiClient();

    const prompt = `Create a high-yield study sheet for:
Subject: ${subject || 'Science / Academic'}
Chapter / Title: ${chapterTitle || 'Core Concepts'}
Study Material / Context: ${rawText ? rawText.slice(0, 10000) : 'Provide standard curriculum concepts for ' + chapterTitle}
Request Type: ${type} (e.g. summary, formula-sheet, q-and-a, flashcards)

Extract:
1. Executive chapter summary (high-density, no fluff).
2. Key terms & definitions.
3. Core formulas / laws (with LaTeX notation).
4. High-yield exam Q&A.
5. 5 high-impact flashcard pairs (Front prompt, Back answer).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            subject: { type: Type.STRING },
            summaryParagraphs: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            keyDefinitions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  term: { type: Type.STRING },
                  definition: { type: Type.STRING },
                },
                required: ['term', 'definition'],
              },
            },
            formulasOrLaws: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  formula: { type: Type.STRING },
                  application: { type: Type.STRING },
                },
                required: ['name', 'formula', 'application'],
              },
            },
            highYieldQA: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  answer: { type: Type.STRING },
                  examRelevance: { type: Type.STRING },
                },
                required: ['question', 'answer'],
              },
            },
            flashcards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  front: { type: Type.STRING },
                  back: { type: Type.STRING },
                  topic: { type: Type.STRING },
                },
                required: ['front', 'back'],
              },
            },
          },
          required: ['title', 'summaryParagraphs', 'keyDefinitions', 'formulasOrLaws', 'flashcards'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (err: any) {
    console.error('Error in /api/ai/summarize:', err);
    res.status(500).json({ error: err.message || 'Failed to generate summary.' });
  }
});

// 7. Weak Topic Diagnostic Endpoint
app.post('/api/ai/analyze-weaknesses', async (req: Request, res: Response) => {
  try {
    const { attempts, subject } = req.body;

    if (!Array.isArray(attempts) || attempts.length === 0) {
      res.json({
        diagnosis: 'Need at least 1 completed quiz attempt to analyze patterns accurately.',
        weakTopics: [],
        recommendations: ['Complete a quiz to identify areas needing reinforcement.'],
      });
      return;
    }

    const ai = getGeminiClient();

    const prompt = `Analyze these student quiz performance records:
Subject: ${subject || 'General'}
Attempts: ${JSON.stringify(attempts.slice(-10))}

Provide an objective diagnostic report:
1. Identify specific conceptual weaknesses or recurring mistake patterns.
2. Recommend immediate priority revision topics.
3. Suggest 3 targeted practice tips.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            diagnosis: { type: Type.STRING },
            weakTopics: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  topic: { type: Type.STRING },
                  reason: { type: Type.STRING },
                  severity: { type: Type.STRING },
                },
                required: ['topic', 'reason', 'severity'],
              },
            },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['diagnosis', 'weakTopics', 'recommendations'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (err: any) {
    console.error('Error in /api/ai/analyze-weaknesses:', err);
    res.status(500).json({ error: err.message || 'Failed to analyze weaknesses.' });
  }
});

// Server status and diagnostics endpoint
app.get('/api/status', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    time: new Date().toISOString(),
  });
});

// Production vs Development Vite handling
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Nexora Learn AI Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
