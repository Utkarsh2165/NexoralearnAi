/**
 * Client-Side API Gateway
 * Communicates with server-side /api/ai endpoints.
 * Never handles API keys directly.
 */

export interface ChatRequest {
  message: string;
  conversationHistory?: Array<{ role: 'user' | 'model'; text: string }>;
  subject?: string;
  mode?: 'concise' | 'detailed' | 'exam' | 'simple';
  language?: string;
  image?: { mimeType: string; data: string };
}

export interface QuizGenRequest {
  subject: string;
  grade?: string;
  topic: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  count?: number;
  format?: 'mcq' | 'true_false' | 'short';
}

export interface RoadmapGenRequest {
  classLevel: string;
  board: string;
  examDate: string;
  currentMarks: string;
  targetMarks: string;
  dailyHours: number;
  subjects: string[];
  weakTopics?: string[];
}

export interface CheckAnswerRequest {
  question: string;
  studentAnswer: string;
  board?: string;
  targetMarks?: number;
  image?: { mimeType: string; data: string };
}

export interface MathSolveRequest {
  equation: string;
  topic?: string;
}

export interface SummarizeRequest {
  subject?: string;
  chapterTitle?: string;
  rawText?: string;
  type?: 'summary' | 'formula-sheet' | 'q-and-a' | 'flashcards';
}

class ApiService {
  private async postJson<T>(endpoint: string, body: any): Promise<T> {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      let errorMessage = `Server error (${response.status})`;
      try {
        const errorJson = await response.json();
        if (errorJson && errorJson.error) {
          errorMessage = errorJson.error;
        }
      } catch {
        // use default status message
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }

  async sendChatMessage(req: ChatRequest): Promise<{ reply: string }> {
    return this.postJson<{ reply: string }>('/api/ai/chat', req);
  }

  async generateQuiz(req: QuizGenRequest): Promise<any> {
    return this.postJson('/api/ai/quiz', req);
  }

  async generateRoadmap(req: RoadmapGenRequest): Promise<any> {
    return this.postJson('/api/ai/roadmap', req);
  }

  async checkAnswer(req: CheckAnswerRequest): Promise<any> {
    return this.postJson('/api/ai/check-answer', req);
  }

  async solveMath(req: MathSolveRequest): Promise<any> {
    return this.postJson('/api/ai/solve-math', req);
  }

  async summarizeNotes(req: SummarizeRequest): Promise<any> {
    return this.postJson('/api/ai/summarize', req);
  }

  async analyzeWeaknesses(attempts: any[], subject?: string): Promise<any> {
    return this.postJson('/api/ai/analyze-weaknesses', { attempts, subject });
  }

  async checkServerStatus(): Promise<{ status: string; hasGeminiKey: boolean }> {
    try {
      const res = await fetch('/api/status');
      if (!res.ok) return { status: 'offline', hasGeminiKey: false };
      return res.json();
    } catch {
      return { status: 'offline', hasGeminiKey: false };
    }
  }
}

export const api = new ApiService();
