import React, { useState, useRef } from 'react';
import { api } from '../services/api';
import { storage } from '../services/storage';
import { BRAND_CONFIG } from '../config/brand';
import { MathRenderer } from './MathRenderer';
import { 
  CheckCircle2, 
  Sparkles, 
  Paperclip, 
  AlertCircle, 
  Award, 
  FileText, 
  XCircle, 
  HelpCircle,
  Image as ImageIcon
} from 'lucide-react';

export const AnswerChecker: React.FC = () => {
  const profile = storage.getUserProfile();

  const [question, setQuestion] = useState(
    'Explain Kepler\'s Second Law of Planetary Motion and show how it relates to conservation of angular momentum.'
  );
  const [studentAnswer, setStudentAnswer] = useState(
    'Kepler\'s second law states that planets sweep equal areas in equal intervals of time. When a planet is near perihelion it moves faster, and at aphelion it moves slower. This happens because angular momentum L = m*r*v is conserved since gravitational force is purely central with zero external torque.'
  );
  const [board, setBoard] = useState(profile.board || 'CBSE (Central Board)');
  const [targetMarks, setTargetMarks] = useState<number>(5);
  const [selectedImage, setSelectedImage] = useState<{ mimeType: string; data: string } | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImage({
        mimeType: file.type,
        data: event.target?.result as string,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleEvaluate = async () => {
    if (!question.trim() && !selectedImage) return;
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await api.checkAnswer({
        question,
        studentAnswer,
        board,
        targetMarks,
        image: selectedImage || undefined,
      });

      setResult(res);
    } catch (err: any) {
      console.error('Check Answer Error:', err);
      setErrorMessage(
        err.message || 'Failed to evaluate answer. Please verify server connection.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <CheckCircle2 className="w-6 h-6 text-rose-400" />
          <span>Academic Answer Checker & Rubric Evaluator</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Get objective, rubric-based feedback on handwritten or typed descriptive answers before board examinations.
        </p>
      </div>

      {/* Input Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Target Board / Exam Standard
            </label>
            <select
              value={board}
              onChange={(e) => setBoard(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
            >
              {BRAND_CONFIG.boards.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Maximum Marks for Question ({targetMarks} Marks)
            </label>
            <select
              value={targetMarks}
              onChange={(e) => setTargetMarks(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white font-mono"
            >
              {[2, 3, 5, 8, 10].map((m) => (
                <option key={m} value={m}>
                  {m} Marks
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Question Prompt */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            The Examination Question
          </label>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Type or paste the exam question here..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-rose-500"
          />
        </div>

        {/* Student's Drafted Answer */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Your Written Answer (or upload handwritten photo below)
            </label>
            <span className="text-[11px] text-slate-500 font-mono">
              {studentAnswer.split(/\s+/).filter(Boolean).length} words
            </span>
          </div>
          <textarea
            rows={5}
            value={studentAnswer}
            onChange={(e) => setStudentAnswer(e.target.value)}
            placeholder="Type your detailed answer response..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-rose-500 leading-relaxed font-sans"
          />
        </div>

        {/* Photo Upload Attachment */}
        <div className="flex items-center gap-3">
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
            className="px-3.5 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg text-xs flex items-center gap-2 cursor-pointer"
          >
            <Paperclip className="w-3.5 h-3.5 text-indigo-400" />
            <span>Attach Handwritten Page Photo</span>
          </button>

          {selectedImage && (
            <div className="flex items-center gap-2 text-xs text-indigo-300">
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Image loaded</span>
              <button
                onClick={() => setSelectedImage(null)}
                className="text-slate-500 hover:text-rose-400 text-[11px] ml-1 cursor-pointer"
              >
                (Remove)
              </button>
            </div>
          )}
        </div>

        {errorMessage && (
          <div className="p-4 bg-rose-950/60 border border-rose-800 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            onClick={handleEvaluate}
            disabled={loading || (!question.trim() && !selectedImage)}
            className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 disabled:opacity-50 text-white font-medium text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin text-amber-300" />
                <span>Evaluating Against Rubric Criteria...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Evaluate Answer & Generate Rubric</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Result Display */}
      {result && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 animate-fade-in">
          {/* Estimated Score Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-slate-950 border border-slate-800">
            <div>
              <span className="text-xs uppercase font-semibold text-slate-400">
                Estimated Rubric Score
              </span>
              <div className="text-2xl sm:text-3xl font-bold font-mono text-amber-300 mt-1">
                {result.estimatedScore} / {result.maxScore}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Note: Diagnostic AI assessment for learning feedback, not official examination mark.
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs font-semibold text-emerald-400">
                {Math.round((result.estimatedScore / result.maxScore) * 100)}% Proficiency
              </span>
            </div>
          </div>

          {/* Feedback summary */}
          <div className="space-y-1">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Overall Examiner Remark
            </h3>
            <p className="text-sm text-slate-200 leading-relaxed">
              {result.overallFeedback}
            </p>
          </div>

          {/* Strengths vs Deficiencies */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Strengths */}
            <div className="p-4 bg-emerald-950/30 border border-emerald-900/40 rounded-xl space-y-2">
              <h4 className="text-xs font-bold text-emerald-300 flex items-center gap-1.5 uppercase">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>What was Done Correctly</span>
              </h4>
              <ul className="space-y-1.5 text-xs text-emerald-100">
                {result.strengths?.map((s: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">·</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Mistakes / Missing */}
            <div className="p-4 bg-rose-950/30 border border-rose-900/40 rounded-xl space-y-2">
              <h4 className="text-xs font-bold text-rose-300 flex items-center gap-1.5 uppercase">
                <XCircle className="w-4 h-4 text-rose-400" />
                <span>Omissions / Points to Improve</span>
              </h4>
              <ul className="space-y-1.5 text-xs text-rose-100">
                {result.mistakesOrMissingPoints?.map((m: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-rose-400 mt-0.5">·</span>
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Rubric Matrix */}
          {result.rubricBreakdown && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Marking Rubric Breakdown
              </h4>
              <div className="space-y-2">
                {result.rubricBreakdown.map((r: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-white">{r.criterion}</div>
                      <div className="text-slate-400 text-[11px]">{r.remark}</div>
                    </div>
                    <div className="font-mono font-bold text-amber-300 shrink-0 ml-4">
                      {r.scoreAwarded} / {r.maxCriterionScore}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Exemplar Model Answer */}
          <div className="p-5 bg-slate-950 border border-violet-900/40 rounded-xl space-y-2">
            <h4 className="text-xs font-bold text-violet-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Full-Marks Model Answer (Exemplar)</span>
            </h4>
            <div className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
              <MathRenderer content={result.improvedModelAnswer} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
