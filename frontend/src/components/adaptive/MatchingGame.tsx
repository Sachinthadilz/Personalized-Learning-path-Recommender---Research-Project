// MatchingGame – interactive term-definition matching game for adaptive retraining
import React, { useState, useCallback, useMemo } from "react";
import { CheckCircle, XCircle, RefreshCw, Trophy } from "lucide-react";

interface TermPair {
  term: string;
  definition: string;
}

interface Props {
  subjectName: string;
  onComplete: (score: number, total: number) => void;
  onSkip: () => void;
}

// Subject-specific term banks
const TERM_BANKS: Record<string, TermPair[]> = {
  oop: [
    { term: "Encapsulation", definition: "Bundling data and methods into a single unit (class)" },
    { term: "Inheritance", definition: "A class acquires properties from another class" },
    { term: "Polymorphism", definition: "One interface, many implementations" },
    { term: "Abstraction", definition: "Hiding complex details, showing only essentials" },
    { term: "Class", definition: "A blueprint/template for creating objects" },
    { term: "Object", definition: "An instance of a class" },
  ],
  "object oriented programming": [
    { term: "Encapsulation", definition: "Bundling data and methods into a single unit (class)" },
    { term: "Inheritance", definition: "A class acquires properties from another class" },
    { term: "Polymorphism", definition: "One interface, many implementations" },
    { term: "Abstraction", definition: "Hiding complex details, showing only essentials" },
  ],
  se: [
    { term: "SRS", definition: "Software Requirements Specification document" },
    { term: "Waterfall", definition: "Sequential development model, phase by phase" },
    { term: "Agile", definition: "Iterative development with short sprints" },
    { term: "UML", definition: "Unified Modelling Language for system design" },
    { term: "Testing", definition: "Process of verifying software correctness" },
  ],
  "software engineering": [
    { term: "SRS", definition: "Software Requirements Specification document" },
    { term: "Waterfall", definition: "Sequential development model, phase by phase" },
    { term: "Agile", definition: "Iterative development with short sprints" },
    { term: "UML", definition: "Unified Modelling Language for system design" },
  ],
  ip: [
    { term: "HTTP", definition: "Protocol for transferring web pages" },
    { term: "HTML", definition: "Markup language for structuring web content" },
    { term: "CSS", definition: "Stylesheet language for web page styling" },
    { term: "DNS", definition: "System that maps domain names to IP addresses" },
    { term: "Client", definition: "The browser that requests resources" },
  ],
  "internet programming": [
    { term: "HTTP", definition: "Protocol for transferring web pages" },
    { term: "HTML", definition: "Markup language for structuring web content" },
    { term: "CSS", definition: "Stylesheet language for web page styling" },
    { term: "DNS", definition: "System that maps domain names to IP addresses" },
  ],
};

const GENERIC_TERMS: TermPair[] = [
  { term: "Analysis", definition: "Breaking a problem into smaller understandable parts" },
  { term: "Synthesis", definition: "Combining parts to form a complete whole" },
  { term: "Evaluation", definition: "Judging the value or quality of something" },
  { term: "Application", definition: "Using knowledge in a new or practical context" },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const MatchingGame: React.FC<Props> = ({ subjectName, onComplete, onSkip }) => {
  const pairs = useMemo(() => {
    const key = subjectName.toLowerCase().trim();
    const bank = TERM_BANKS[key] ?? GENERIC_TERMS;
    return shuffle(bank).slice(0, 4);
  }, [subjectName]);

  const [shuffledTerms] = useState(() => shuffle(pairs.map((p) => p.term)));
  const [shuffledDefs] = useState(() => shuffle(pairs.map((p) => p.definition)));

  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [matched, setMatched] = useState<Record<string, string>>({});   // term → def
  const [wrongPair, setWrongPair] = useState<[string, string] | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const matchedTerms = Object.keys(matched);
  const matchedDefs = Object.values(matched);

  const handleSelectTerm = (term: string) => {
    if (matchedTerms.includes(term)) return;
    setSelectedTerm(term === selectedTerm ? null : term);
    setWrongPair(null);
  };

  const handleSelectDef = useCallback(
    (def: string) => {
      if (!selectedTerm) return;
      if (matchedDefs.includes(def)) return;

      const correctDef = pairs.find((p) => p.term === selectedTerm)?.definition;
      if (def === correctDef) {
        const newMatched = { ...matched, [selectedTerm]: def };
        setMatched(newMatched);
        setScore((s) => s + 1);
        setSelectedTerm(null);
        setWrongPair(null);
        if (Object.keys(newMatched).length === pairs.length) {
          setTimeout(() => setDone(true), 400);
        }
      } else {
        setWrongPair([selectedTerm, def]);
        setTimeout(() => {
          setSelectedTerm(null);
          setWrongPair(null);
        }, 900);
      }
    },
    [selectedTerm, matched, matchedDefs, pairs]
  );

  if (done) {
    const pct = Math.round((score / pairs.length) * 100);
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6 text-center max-w-lg mx-auto">
        <Trophy className="w-12 h-12 text-amber-400 mx-auto" />
        <h3 className="text-xl font-bold text-slate-800">Game Complete!</h3>
        <p className="text-slate-600 text-sm">
          You matched <span className="font-bold text-emerald-700">{score}/{pairs.length}</span> pairs correctly ({pct}%).
        </p>
        <p className="text-sm text-slate-500">
          {pct === 100
            ? "Perfect score! You're ready to retry the quiz."
            : pct >= 75
            ? "Great job! Review the ones you missed, then try the quiz."
            : "Keep reviewing your notes — you'll get there!"}
        </p>
        <button
          onClick={() => onComplete(score, pairs.length)}
          className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition"
        >
          Continue to Quiz →
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-800">🎮 Matching Game – {subjectName}</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Click a <span className="text-indigo-600 font-semibold">term</span> on the left, then its{" "}
            <span className="text-purple-600 font-semibold">definition</span> on the right.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">{matchedTerms.length}/{pairs.length} matched</span>
          <button onClick={onSkip} className="text-xs text-slate-400 hover:underline">
            Skip game
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-400 to-emerald-400 rounded-full transition-all duration-500"
          style={{ width: `${(matchedTerms.length / pairs.length) * 100}%` }}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Terms column */}
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 mb-2">Terms</p>
          {shuffledTerms.map((term) => {
            const isMatched = matchedTerms.includes(term);
            const isSel = selectedTerm === term;
            const isWrong = wrongPair?.[0] === term;
            return (
              <button
                key={term}
                onClick={() => handleSelectTerm(term)}
                disabled={isMatched}
                className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                  isMatched
                    ? "bg-emerald-50 border-emerald-300 text-emerald-700 opacity-70 cursor-default"
                    : isWrong
                    ? "bg-red-50 border-red-400 text-red-700"
                    : isSel
                    ? "bg-indigo-100 border-indigo-500 text-indigo-800 shadow"
                    : "border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 text-slate-700"
                }`}
              >
                <span className="flex items-center justify-between gap-2">
                  {term}
                  {isMatched && <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
                  {isWrong && <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />}
                </span>
              </button>
            );
          })}
        </div>

        {/* Definitions column */}
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-purple-600 mb-2">Definitions</p>
          {shuffledDefs.map((def) => {
            const isMatched = matchedDefs.includes(def);
            const isWrong = wrongPair?.[1] === def;
            return (
              <button
                key={def}
                onClick={() => handleSelectDef(def)}
                disabled={isMatched || !selectedTerm}
                className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                  isMatched
                    ? "bg-emerald-50 border-emerald-300 text-emerald-700 opacity-70 cursor-default"
                    : isWrong
                    ? "bg-red-50 border-red-400 text-red-700"
                    : selectedTerm && !isMatched
                    ? "border-purple-300 hover:border-purple-500 hover:bg-purple-50 text-slate-700 cursor-pointer"
                    : "border-slate-200 text-slate-500 cursor-not-allowed opacity-60"
                }`}
              >
                {def}
              </button>
            );
          })}
        </div>
      </div>

      {wrongPair && (
        <p className="text-xs text-red-600 text-center animate-pulse">
          ✗ That doesn't match — try again!
        </p>
      )}

      <div className="flex justify-end">
        <button
          onClick={onSkip}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition"
        >
          <RefreshCw className="w-3 h-3" />
          Skip game, go to quiz
        </button>
      </div>
    </div>
  );
};

export default MatchingGame;
