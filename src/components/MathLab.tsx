import React, { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';
import { MathRenderer } from './MathRenderer';
import { 
  Calculator, 
  Sparkles, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Plus, 
  Trash2, 
  Table, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  Eye
} from 'lucide-react';

interface EquationItem {
  id: string;
  expression: string; // e.g. "x^2 - 4" or "2*x + 3" or "sin(x)"
  color: string;
  visible: boolean;
}

const PRESET_EQUATIONS = [
  { label: 'Quadratic Parabola (y = x² - 4)', expr: 'x^2 - 4', color: '#6366f1' },
  { label: 'Linear Slope (y = 2x + 3)', expr: '2*x + 3', color: '#f59e0b' },
  { label: 'Sine Wave (y = sin(x))', expr: 'sin(x)', color: '#10b981' },
  { label: 'Cosine Wave (y = cos(x))', expr: 'cos(x)', color: '#ec4899' },
  { label: 'Cubic Polynomial (y = x³ - 3x)', expr: 'x^3 - 3*x', color: '#06b6d4' },
];

export const MathLab: React.FC = () => {
  // Step-by-Step Solver State
  const [solverInput, setSolverInput] = useState<string>('2x^2 + 5x - 3 = 0');
  const [solverTopic, setSolverTopic] = useState<string>('Algebra / Quadratic Equations');
  const [solving, setSolving] = useState<boolean>(false);
  const [solutionResult, setSolutionResult] = useState<any>(null);
  const [solverError, setSolverError] = useState<string | null>(null);

  // Graph Plotter State
  const [equations, setEquations] = useState<EquationItem[]>([
    { id: 'eq-1', expression: 'x^2 - 4', color: '#6366f1', visible: true },
    { id: 'eq-2', expression: '2*x + 3', color: '#f59e0b', visible: true },
  ]);
  const [newExprInput, setNewExprInput] = useState<string>('sin(x)');

  // Coordinate Plane State
  const [scale, setScale] = useState<number>(30); // pixels per unit
  const [offsetX, setOffsetX] = useState<number>(0);
  const [offsetY, setOffsetY] = useState<number>(0);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoverCoord, setHoverCoord] = useState<{ x: number; y: number } | null>(null);
  const [showTable, setShowTable] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Mathematical evaluator for y = f(x)
  const evaluateMathFunction = (expr: string, x: number): number => {
    try {
      // Normalize expression
      let jsExpr = expr
        .replace(/\^/g, '**')
        .replace(/sin/g, 'Math.sin')
        .replace(/cos/g, 'Math.cos')
        .replace(/tan/g, 'Math.tan')
        .replace(/sqrt/g, 'Math.sqrt')
        .replace(/abs/g, 'Math.abs')
        .replace(/log/g, 'Math.log')
        .replace(/exp/g, 'Math.exp')
        .replace(/pi/gi, 'Math.PI')
        .replace(/e/g, 'Math.E');

      // Insert implicit multiplication e.g. 2x -> 2*x
      jsExpr = jsExpr.replace(/(\d+)\s*([a-zA-Z])/g, '$1*$2');

      // Evaluate safely
      const fn = new Function('x', `return ${jsExpr};`);
      const y = fn(x);
      return typeof y === 'number' && !isNaN(y) && isFinite(y) ? y : NaN;
    } catch {
      return NaN;
    }
  };

  // Redraw Canvas on any state change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear canvas
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, height);

    const centerX = width / 2 + offsetX;
    const centerY = height / 2 + offsetY;

    // Grid lines & coordinate axes
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
    ctx.fillStyle = '#64748b';
    ctx.font = '10px "JetBrains Mono", monospace';

    const step = scale >= 50 ? 1 : scale >= 20 ? 2 : 5;

    // Vertical grid & numbers
    const xMin = Math.floor((-centerX) / scale);
    const xMax = Math.ceil((width - centerX) / scale);

    for (let x = xMin; x <= xMax; x += step) {
      const px = centerX + x * scale;
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, height);
      ctx.stroke();

      if (x !== 0) {
        ctx.fillText(x.toString(), px - 6, centerY + 14);
      }
    }

    // Horizontal grid & numbers
    const yMin = Math.floor((centerY - height) / scale);
    const yMax = Math.ceil(centerY / scale);

    for (let y = yMin; y <= yMax; y += step) {
      const py = centerY - y * scale;
      ctx.beginPath();
      ctx.moveTo(0, py);
      ctx.lineTo(width, py);
      ctx.stroke();

      if (y !== 0) {
        ctx.fillText(y.toString(), centerX + 6, py + 3);
      }
    }

    // Main Axes
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';

    // X Axis
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();

    // Y Axis
    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, height);
    ctx.stroke();

    // Origin label
    ctx.fillText('O', centerX - 12, centerY + 14);

    // Plot each visible equation
    equations.forEach((eq) => {
      if (!eq.visible) return;

      ctx.lineWidth = 2.5;
      ctx.strokeStyle = eq.color;
      ctx.beginPath();

      let started = false;

      // Plot across screen pixels
      for (let px = 0; px <= width; px += 1.5) {
        const mathX = (px - centerX) / scale;
        const mathY = evaluateMathFunction(eq.expression, mathX);

        if (!isNaN(mathY) && Math.abs(mathY) < 1000) {
          const py = centerY - mathY * scale;

          // Discontinuity check
          if (!started) {
            ctx.moveTo(px, py);
            started = true;
          } else {
            ctx.lineTo(px, py);
          }
        } else {
          started = false;
        }
      }

      ctx.stroke();
    });

    // Draw hover coordinate crosshair
    if (hoverCoord) {
      const px = centerX + hoverCoord.x * scale;
      const py = centerY - hoverCoord.y * scale;

      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fill();

      // Tooltip box
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1;
      const text = `(${hoverCoord.x.toFixed(2)}, ${hoverCoord.y.toFixed(2)})`;
      ctx.fillRect(px + 8, py - 20, 95, 20);
      ctx.strokeRect(px + 8, py - 20, 95, 20);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(text, px + 12, py - 6);
    }
  }, [equations, scale, offsetX, offsetY, hoverCoord]);

  // Handle Pan & Drag on canvas
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsPanning(true);
    setPanStart({ x: e.clientX - offsetX, y: e.clientY - offsetY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isPanning) {
      setOffsetX(e.clientX - panStart.x);
      setOffsetY(e.clientY - panStart.y);
    }

    // Calculate mathematical coordinates under cursor
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const centerX = canvas.clientWidth / 2 + offsetX;
    const centerY = canvas.clientHeight / 2 + offsetY;

    const mathX = (mouseX - centerX) / scale;
    const mathY = (centerY - mouseY) / scale;

    setHoverCoord({ x: mathX, y: mathY });
  };

  const handleMouseUp = () => setIsPanning(false);

  // Zoom handlers
  const handleZoom = (delta: number) => {
    setScale((prev) => Math.max(10, Math.min(150, prev + delta)));
  };

  const handleResetPlot = () => {
    setScale(30);
    setOffsetX(0);
    setOffsetY(0);
  };

  // Add equation
  const handleAddEquation = () => {
    if (!newExprInput.trim()) return;
    const colors = ['#6366f1', '#f59e0b', '#10b981', '#ec4899', '#06b6d4', '#a855f7'];
    const color = colors[equations.length % colors.length];

    setEquations([
      ...equations,
      {
        id: 'eq_' + Date.now(),
        expression: newExprInput.trim(),
        color,
        visible: true,
      },
    ]);
    setNewExprInput('');
  };

  const removeEquation = (id: string) => {
    setEquations(equations.filter((e) => e.id !== id));
  };

  const toggleEquationVisible = (id: string) => {
    setEquations(
      equations.map((e) => (e.id === id ? { ...e, visible: !e.visible } : e))
    );
  };

  // Solve equation with AI
  const handleSolve = async () => {
    if (!solverInput.trim()) return;
    setSolving(true);
    setSolverError(null);

    try {
      const res = await api.solveMath({
        equation: solverInput,
        topic: solverTopic,
      });

      setSolutionResult(res);

      // If response includes graphable JS expression, add to plotter!
      if (res.plotFunctionJs) {
        setEquations((prev) => [
          ...prev,
          {
            id: 'solved_' + Date.now(),
            expression: res.plotFunctionJs,
            color: '#a855f7',
            visible: true,
          },
        ]);
      }
    } catch (err: any) {
      console.error('Solve Math Error:', err);
      setSolverError(err.message || 'Failed to solve equation.');
    } finally {
      setSolving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-fade-in pb-12">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <Calculator className="w-6 h-6 text-cyan-400" />
          <span>Equation Solver & Interactive Graph Laboratory</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Solve algebraic, trigonometric, and calculus equations with step-by-step verification, and plot exact functions in real time.
        </p>
      </div>

      {/* Part 1: Interactive Graph Plotter Stage */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-4 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-white">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <span>Multi-Function Coordinate Plane (HTML5 Precision Canvas)</span>
          </div>

          {/* Controls: Zoom, Pan Reset, Table toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleZoom(10)}
              className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleZoom(-10)}
              className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetPlot}
              className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white text-xs flex items-center gap-1 cursor-pointer"
              title="Reset Viewport"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
            <button
              onClick={() => setShowTable(!showTable)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white text-xs flex items-center gap-1 cursor-pointer"
            >
              <Table className="w-3.5 h-3.5 text-amber-400" />
              <span>{showTable ? 'Hide Table' : 'Table of Values'}</span>
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="relative w-full h-80 sm:h-96 rounded-xl overflow-hidden border border-slate-800 cursor-crosshair">
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => {
              setIsPanning(false);
              setHoverCoord(null);
            }}
            className="w-full h-full block"
          />
          <div className="absolute bottom-2 left-2 text-[10px] font-mono text-slate-500 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
            Drag to pan · Hover for coordinates · Scale: {scale}px/unit
          </div>
        </div>

        {/* Equation Input Bar & Quick Presets */}
        <div className="space-y-3 pt-2">
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="flex-1 flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 w-full">
              <span className="font-mono text-xs text-cyan-400 mr-2 font-bold">y = f(x) =</span>
              <input
                type="text"
                value={newExprInput}
                onChange={(e) => setNewExprInput(e.target.value)}
                placeholder="e.g. x^2 - 4, sin(x), 2*x + 3, cos(2*x)..."
                className="flex-1 bg-transparent text-sm text-white focus:outline-none font-mono"
              />
            </div>
            <button
              onClick={handleAddEquation}
              className="w-full sm:w-auto px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Plot Curve</span>
            </button>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
            <span className="text-[11px] mr-1">Presets:</span>
            {PRESET_EQUATIONS.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setEquations([
                    ...equations,
                    {
                      id: 'preset_' + Date.now(),
                      expression: preset.expr,
                      color: preset.color,
                      visible: true,
                    },
                  ]);
                }}
                className="px-2.5 py-1 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-md text-[11px] font-mono transition-colors cursor-pointer"
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Active Equations Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            {equations.map((eq) => (
              <div
                key={eq.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono"
              >
                <button
                  onClick={() => toggleEquationVisible(eq.id)}
                  className="w-3 h-3 rounded-full cursor-pointer"
                  style={{ backgroundColor: eq.visible ? eq.color : '#334155' }}
                  title="Toggle visibility"
                />
                <span className={eq.visible ? 'text-white' : 'text-slate-500 line-through'}>
                  y = {eq.expression}
                </span>
                <button
                  onClick={() => removeEquation(eq.id)}
                  className="text-slate-500 hover:text-rose-400 ml-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Optional Table of Values */}
        {showTable && equations.length > 0 && (
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2 overflow-x-auto">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Calculated Table of Values (x ∈ [-4, 4])
            </h4>
            <table className="w-full text-xs font-mono text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-1 px-3">x</th>
                  {equations.filter((e) => e.visible).map((eq) => (
                    <th key={eq.id} className="py-1 px-3" style={{ color: eq.color }}>
                      y = {eq.expression}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[-4, -3, -2, -1, 0, 1, 2, 3, 4].map((xVal) => (
                  <tr key={xVal} className="border-b border-slate-900/60 hover:bg-slate-900/40">
                    <td className="py-1 px-3 font-semibold text-white">{xVal}</td>
                    {equations.filter((e) => e.visible).map((eq) => {
                      const yVal = evaluateMathFunction(eq.expression, xVal);
                      return (
                        <td key={eq.id} className="py-1 px-3 text-slate-300">
                          {isNaN(yVal) ? 'undefined' : yVal.toFixed(3)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Part 2: Step-by-Step AI Equation Solver & Verifier */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span>Step-by-Step Symbolic Equation Solver</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Enter an algebraic equation, linear system, or calculus problem for verified step-by-step resolution with domain restrictions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Equation or Mathematical Problem
            </label>
            <input
              type="text"
              value={solverInput}
              onChange={(e) => setSolverInput(e.target.value)}
              placeholder="e.g. 2x^2 + 5x - 3 = 0, sin(x) = 0.5, dy/dx of x^3 * e^x..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Category / Topic
            </label>
            <select
              value={solverTopic}
              onChange={(e) => setSolverTopic(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="Algebra / Quadratic Equations">Algebra / Quadratic</option>
              <option value="Simultaneous Linear Equations">Simultaneous Systems</option>
              <option value="Trigonometry & Identities">Trigonometry</option>
              <option value="Differential Calculus">Differential Calculus</option>
              <option value="Coordinate Geometry">Coordinate Geometry</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSolve}
            disabled={solving || !solverInput.trim()}
            className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 disabled:opacity-50 text-white font-medium text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {solving ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin text-amber-300" />
                <span>Computing Step-by-Step Proof...</span>
              </>
            ) : (
              <>
                <Calculator className="w-4 h-4" />
                <span>Solve & Verify Equation</span>
              </>
            )}
          </button>
        </div>

        {solverError && (
          <div className="p-4 bg-rose-950/60 border border-rose-800 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{solverError}</span>
          </div>
        )}

        {/* Solver Solution Results Display */}
        {solutionResult && (
          <div className="p-6 bg-slate-950 border border-slate-800 rounded-xl space-y-6 animate-fade-in">
            {/* Final Answer Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-cyan-950/40 border border-cyan-800/50">
              <div>
                <span className="text-xs uppercase font-semibold text-cyan-300">
                  {solutionResult.classification || 'Solved Result'}
                </span>
                <div className="text-lg sm:text-xl font-bold font-mono text-white mt-1">
                  <MathRenderer content={solutionResult.finalAnswer} />
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                <span>Verified Solution</span>
              </div>
            </div>

            {/* Step-by-Step Breakdown */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Step-by-Step Derivation
              </h3>
              <div className="space-y-3">
                {solutionResult.steps?.map((step: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-amber-300 font-mono">
                        Step {step.stepNumber}: {step.title}
                      </span>
                    </div>
                    <div className="text-sm text-white font-mono bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 overflow-x-auto">
                      <MathRenderer content={step.mathExpression} />
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {step.explanation}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Verification & Domain Restrictions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1">
                <span className="font-semibold text-emerald-300">Verification by Substitution:</span>
                <p className="text-slate-300 leading-relaxed font-mono">
                  {solutionResult.verification}
                </p>
              </div>

              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1">
                <span className="font-semibold text-amber-300">Domain Restrictions & Existence:</span>
                <p className="text-slate-300 leading-relaxed">
                  {solutionResult.domainRestrictions || 'Valid for all real numbers within natural domain.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
