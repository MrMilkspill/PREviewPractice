"use client";

import {
  AlertTriangle,
  BarChart3,
  BookOpenCheck,
  Check,
  Clock,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  Pause,
  Play,
  RefreshCcw,
  RotateCcw,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { difficultyOptions } from "@/data/options";
import {
  OfficialPracticeExam,
  officialPracticeExams,
} from "@/data/officialPracticeExams";
import {
  adjacentRatingGuidance,
  formatRating,
  scoreRating,
  scoreScenario,
} from "@/lib/scoring";
import {
  DifficultyLevel,
  GenerationCategory,
  Rating,
  Scenario,
  StoredAttempt,
  generationCategories,
  ratingLabels,
} from "@/types/scenario";

const aiHistoryKey = "preview-scenario-drills-history-v2";
const generatedKey = "preview-scenario-drills-generated-v2";
const officialExamStateKey = "preview-official-exam-state-v1";

type ViewMode = "preview-exam-1" | "preview-exam-2" | "ai" | "dashboard";

interface OfficialExamState {
  examId: OfficialPracticeExam["id"];
  timerEnabled: boolean;
  timerRunning: boolean;
  secondsRemaining: number;
  startedAt: string;
  submittedAt?: string;
  itemCounts: number[];
  ratings: Record<string, Rating>;
  targets: Record<string, Rating>;
}

function makeDefaultItemCounts(scenarioCount: number, itemCount: number) {
  const base = Math.floor(itemCount / scenarioCount);
  const remainder = itemCount % scenarioCount;

  return Array.from({ length: scenarioCount }, (_, index) =>
    index < remainder ? base + 1 : base,
  );
}

function createInitialExamState(
  exam: OfficialPracticeExam,
  timerEnabled: boolean,
): OfficialExamState {
  return {
    examId: exam.id,
    timerEnabled,
    timerRunning: timerEnabled,
    secondsRemaining: exam.durationMinutes * 60,
    startedAt: new Date().toISOString(),
    itemCounts: makeDefaultItemCounts(exam.scenarioCount, exam.itemCount),
    ratings: {},
    targets: {},
  };
}

function itemId(examId: OfficialPracticeExam["id"], scenarioIndex: number, itemIndex: number) {
  return `${examId}-s${scenarioIndex + 1}-i${itemIndex + 1}`;
}

function formatTime(seconds: number) {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

function examProgress(state: OfficialExamState) {
  const totalItems = state.itemCounts.reduce((total, count) => total + count, 0);
  const answeredItems = Object.keys(state.ratings).length;

  return {
    totalItems,
    answeredItems,
    percentage: totalItems > 0 ? Math.round((answeredItems / totalItems) * 100) : 0,
  };
}

function examKeyProgress(state: OfficialExamState) {
  const allItemIds = state.itemCounts.flatMap((count, scenarioIndex) =>
    Array.from({ length: count }, (_, itemIndex) =>
      itemId(state.examId, scenarioIndex, itemIndex),
    ),
  );
  const keyedItemIds = allItemIds.filter(
    (id) => state.ratings[id] && state.targets[id],
  );
  const totalScore = keyedItemIds.reduce(
    (total, id) => total + scoreRating(state.ratings[id], state.targets[id]),
    0,
  );

  return {
    keyedItems: keyedItemIds.length,
    totalScore,
    maxScore: keyedItemIds.length,
    percentage:
      keyedItemIds.length > 0
        ? Math.round((totalScore / keyedItemIds.length) * 100)
        : 0,
  };
}

function createAttempt(
  scenario: Scenario,
  score: ReturnType<typeof scoreScenario>,
): StoredAttempt {
  return {
    id: `${scenario.id}-${Date.now()}`,
    scenarioId: scenario.id,
    scenarioTitle: scenario.title,
    scenarioText: scenario.scenario_text,
    dateCompleted: new Date().toISOString(),
    competencyTested: scenario.competency_tested,
    difficultyLevel: scenario.difficulty_level,
    sourceType: scenario.source_type,
    totalScore: score.totalScore,
    maxScore: score.maxScore,
    percentage: score.percentage,
    responses: score.responses,
    missedResponses: score.responses.filter((response) => response.pointsEarned < 1),
  };
}

function percentageClass(percentage: number): string {
  if (percentage >= 85) {
    return "text-emerald-700";
  }

  if (percentage >= 65) {
    return "text-amber-700";
  }

  return "text-rose-700";
}

function difficultyLabel(value: DifficultyLevel): string {
  return difficultyOptions.find((option) => option.value === value)?.label ?? value;
}

function toCsvValue(value: string | number | undefined) {
  const text = String(value ?? "").replaceAll('"', '""');
  return `"${text}"`;
}

export function PracticeApp() {
  const [viewMode, setViewMode] = useState<ViewMode>("preview-exam-1");
  const [officialStates, setOfficialStates] = useState<
    Partial<Record<OfficialPracticeExam["id"], OfficialExamState>>
  >({});
  const [selectedExamScenarios, setSelectedExamScenarios] = useState<
    Record<OfficialPracticeExam["id"], number>
  >({
    "preview-exam-1": 0,
    "preview-exam-2": 0,
  });
  const [preStartTimers, setPreStartTimers] = useState<
    Record<OfficialPracticeExam["id"], boolean>
  >({
    "preview-exam-1": true,
    "preview-exam-2": true,
  });
  const [generatedScenarios, setGeneratedScenarios] = useState<Scenario[]>([]);
  const [selectedGeneratedId, setSelectedGeneratedId] = useState<string | null>(null);
  const [aiRatings, setAiRatings] = useState<Record<string, Rating>>({});
  const [aiScore, setAiScore] = useState<ReturnType<typeof scoreScenario> | null>(
    null,
  );
  const [aiHistory, setAiHistory] = useState<StoredAttempt[]>([]);
  const [category, setCategory] = useState<GenerationCategory>("Random mixed");
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("aamc_like_mixed");
  const [hardMode, setHardMode] = useState(false);
  const [showWhy, setShowWhy] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const savedOfficial = window.localStorage.getItem(officialExamStateKey);
      const savedHistory = window.localStorage.getItem(aiHistoryKey);
      const savedGenerated = window.localStorage.getItem(generatedKey);

      if (savedOfficial) {
        try {
          setOfficialStates(JSON.parse(savedOfficial));
        } catch {
          setOfficialStates({});
        }
      }

      if (savedHistory) {
        try {
          setAiHistory(JSON.parse(savedHistory) as StoredAttempt[]);
        } catch {
          setAiHistory([]);
        }
      }

      if (savedGenerated) {
        try {
          const generated = JSON.parse(savedGenerated) as Scenario[];
          setGeneratedScenarios(generated);
          setSelectedGeneratedId(generated[0]?.id ?? null);
        } catch {
          setGeneratedScenarios([]);
        }
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(officialExamStateKey, JSON.stringify(officialStates));
  }, [officialStates]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setOfficialStates((current) => {
        let changed = false;
        const next = { ...current };

        officialPracticeExams.forEach((exam) => {
          const state = next[exam.id];

          if (
            state?.timerEnabled &&
            state.timerRunning &&
            !state.submittedAt &&
            state.secondsRemaining > 0
          ) {
            changed = true;
            next[exam.id] = {
              ...state,
              secondsRemaining: state.secondsRemaining - 1,
              timerRunning: state.secondsRemaining - 1 > 0,
            };
          }
        });

        return changed ? next : current;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  const selectedGeneratedScenario = useMemo(
    () =>
      generatedScenarios.find((scenario) => scenario.id === selectedGeneratedId) ??
      generatedScenarios[0] ??
      null,
    [generatedScenarios, selectedGeneratedId],
  );
  const aiAnsweredCount =
    selectedGeneratedScenario?.responses.filter((response) => aiRatings[response.id])
      .length ?? 0;

  function persistAiHistory(nextHistory: StoredAttempt[]) {
    setAiHistory(nextHistory);
    window.localStorage.setItem(aiHistoryKey, JSON.stringify(nextHistory));
  }

  function persistGenerated(nextScenarios: Scenario[]) {
    setGeneratedScenarios(nextScenarios);
    window.localStorage.setItem(generatedKey, JSON.stringify(nextScenarios));
  }

  function resetAiScenario(scenarioId: string) {
    setSelectedGeneratedId(scenarioId);
    setAiRatings({});
    setAiScore(null);
    setShowWhy(false);
    setViewMode("ai");
  }

  function submitAiScenario() {
    if (!selectedGeneratedScenario) {
      return;
    }

    const nextScore = scoreScenario(selectedGeneratedScenario, aiRatings);
    setAiScore(nextScore);
    persistAiHistory([createAttempt(selectedGeneratedScenario, nextScore), ...aiHistory]);
  }

  async function generateScenario(similarTo?: Scenario) {
    setIsGenerating(true);
    setGenerationError(null);

    try {
      const response = await fetch("/api/generate-scenario", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category: similarTo ? similarTo.competency_tested : category,
          difficulty: similarTo ? similarTo.difficulty_level : difficulty,
          similarTo: similarTo
            ? {
                title: similarTo.title,
                competency_tested: similarTo.competency_tested,
                difficulty_level: similarTo.difficulty_level,
              }
            : undefined,
        }),
      });
      const payload = (await response.json()) as {
        scenario?: Scenario;
        error?: string;
      };

      if (!response.ok || !payload.scenario) {
        throw new Error(payload.error || "Could not generate a scenario.");
      }

      const nextScenarios = [payload.scenario, ...generatedScenarios];
      persistGenerated(nextScenarios);
      resetAiScenario(payload.scenario.id);
    } catch (error) {
      setGenerationError(
        error instanceof Error
          ? error.message
          : "Scenario generation failed. Check the API key and try again.",
      );
    } finally {
      setIsGenerating(false);
    }
  }

  function updateExamState(
    examId: OfficialPracticeExam["id"],
    updater: (state: OfficialExamState) => OfficialExamState,
  ) {
    setOfficialStates((current) => {
      const state = current[examId];

      if (!state) {
        return current;
      }

      return {
        ...current,
        [examId]: updater(state),
      };
    });
  }

  function exportCsv() {
    const officialRows = officialPracticeExams.flatMap((exam) => {
      const state = officialStates[exam.id];

      if (!state) {
        return [];
      }

      return state.itemCounts.flatMap((count, scenarioIndex) =>
        Array.from({ length: count }, (_, itemIndex) => {
          const id = itemId(exam.id, scenarioIndex, itemIndex);
          const userRating = state.ratings[id];
          const targetRating = state.targets[id];
          const points =
            userRating && targetRating ? scoreRating(userRating, targetRating) : "";

          return [
            "official_companion",
            exam.title,
            `Scenario ${scenarioIndex + 1}`,
            `Response ${itemIndex + 1}`,
            userRating ? formatRating(userRating) : "",
            targetRating ? formatRating(targetRating) : "",
            points,
            state.submittedAt ?? "",
          ];
        }),
      );
    });
    const aiRows = aiHistory.flatMap((attempt) =>
      attempt.responses.map((response) => [
        "ai_generated",
        attempt.scenarioTitle,
        attempt.competencyTested,
        response.responseText,
        formatRating(response.userRating),
        formatRating(response.targetRating),
        response.pointsEarned,
        attempt.dateCompleted,
      ]),
    );
    const header = [
      "mode",
      "exam_or_scenario",
      "scenario_or_competency",
      "response",
      "user_rating",
      "target_rating",
      "points_earned",
      "completed_at",
    ];
    const csv = [
      header.map(toCsvValue).join(","),
      ...[...officialRows, ...aiRows].map((row) => row.map(toCsvValue).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "preview-practice-history.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function clearAllProgress() {
    if (!window.confirm("Clear all saved official exam and AI drill progress?")) {
      return;
    }

    setOfficialStates({});
    setAiHistory([]);
    setGeneratedScenarios([]);
    setSelectedGeneratedId(null);
    window.localStorage.removeItem(officialExamStateKey);
    window.localStorage.removeItem(aiHistoryKey);
    window.localStorage.removeItem(generatedKey);
  }

  return (
    <main className="min-h-screen">
      <header className="border-b border-slate-200 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-teal-700 text-white">
                <BookOpenCheck aria-hidden="true" size={23} />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-normal text-slate-950 sm:text-3xl">
                  PREview Scenario Drills
                </h1>
                <p className="text-sm font-medium text-slate-600">
                  Official exam companion plus original AI drills
                </p>
              </div>
            </div>
            <nav className="grid grid-cols-2 gap-2 rounded-lg border border-slate-200 bg-slate-50 p-1 text-sm font-medium sm:grid-cols-4">
              {officialPracticeExams.map((exam) => (
                <button
                  key={exam.id}
                  className={`flex items-center justify-center gap-2 rounded-md px-3 py-2 ${
                    viewMode === exam.id
                      ? "bg-white text-teal-800 shadow-sm"
                      : "text-slate-600 hover:text-slate-950"
                  }`}
                  onClick={() => setViewMode(exam.id)}
                >
                  <FileText aria-hidden="true" size={16} />
                  {exam.id === "preview-exam-1" ? "Exam 1" : "Exam 2"}
                </button>
              ))}
              <button
                className={`flex items-center justify-center gap-2 rounded-md px-3 py-2 ${
                  viewMode === "ai"
                    ? "bg-white text-teal-800 shadow-sm"
                    : "text-slate-600 hover:text-slate-950"
                }`}
                onClick={() => setViewMode("ai")}
              >
                <Sparkles aria-hidden="true" size={16} />
                AI Drills
              </button>
              <button
                className={`flex items-center justify-center gap-2 rounded-md px-3 py-2 ${
                  viewMode === "dashboard"
                    ? "bg-white text-teal-800 shadow-sm"
                    : "text-slate-600 hover:text-slate-950"
                }`}
                onClick={() => setViewMode("dashboard")}
              >
                <BarChart3 aria-hidden="true" size={16} />
                Dashboard
              </button>
            </nav>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            This is an unofficial PREview practice tool. It does not contain or
            reproduce official AAMC questions, answer choices, rationales, or answer
            keys. Use the official AAMC PDFs for the exam content and this app as a
            timing, navigation, rating, and self-check workspace.
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {officialPracticeExams.map((exam) =>
          viewMode === exam.id ? (
            <OfficialExamCompanion
              key={exam.id}
              exam={exam}
              selectedScenario={selectedExamScenarios[exam.id]}
              state={officialStates[exam.id]}
              timerDefault={preStartTimers[exam.id]}
              onTimerDefaultChange={(enabled) =>
                setPreStartTimers((current) => ({ ...current, [exam.id]: enabled }))
              }
              onStart={() =>
                setOfficialStates((current) => ({
                  ...current,
                  [exam.id]: createInitialExamState(exam, preStartTimers[exam.id]),
                }))
              }
              onRestart={() => {
                if (window.confirm(`Restart ${exam.title} and clear its progress?`)) {
                  setOfficialStates((current) => ({
                    ...current,
                    [exam.id]: createInitialExamState(exam, preStartTimers[exam.id]),
                  }));
                  setSelectedExamScenarios((current) => ({
                    ...current,
                    [exam.id]: 0,
                  }));
                }
              }}
              onSelectScenario={(scenarioIndex) =>
                setSelectedExamScenarios((current) => ({
                  ...current,
                  [exam.id]: scenarioIndex,
                }))
              }
              onUpdate={(updater) => updateExamState(exam.id, updater)}
            />
          ) : null,
        )}

        {viewMode === "ai" && (
          <AiDrillWorkspace
            category={category}
            difficulty={difficulty}
            generatedScenarios={generatedScenarios}
            hardMode={hardMode}
            isGenerating={isGenerating}
            generationError={generationError}
            selectedScenario={selectedGeneratedScenario}
            ratings={aiRatings}
            answeredCount={aiAnsweredCount}
            score={aiScore}
            showWhy={showWhy}
            onCategoryChange={setCategory}
            onDifficultyChange={setDifficulty}
            onHardModeChange={setHardMode}
            onGenerate={() => generateScenario()}
            onSelectScenario={resetAiScenario}
            onRatingChange={(responseId, rating) =>
              setAiRatings((current) => ({ ...current, [responseId]: rating }))
            }
            onSubmit={submitAiScenario}
            onReset={() => {
              setAiRatings({});
              setAiScore(null);
              setShowWhy(false);
            }}
            onShowWhyChange={setShowWhy}
            onGenerateSimilar={() =>
              selectedGeneratedScenario
                ? generateScenario(selectedGeneratedScenario)
                : generateScenario()
            }
          />
        )}

        {viewMode === "dashboard" && (
          <Dashboard
            aiHistory={aiHistory}
            officialStates={officialStates}
            onExport={exportCsv}
            onClear={clearAllProgress}
          />
        )}
      </div>
    </main>
  );
}

function OfficialExamCompanion({
  exam,
  state,
  selectedScenario,
  timerDefault,
  onTimerDefaultChange,
  onStart,
  onRestart,
  onSelectScenario,
  onUpdate,
}: {
  exam: OfficialPracticeExam;
  state?: OfficialExamState;
  selectedScenario: number;
  timerDefault: boolean;
  onTimerDefaultChange: (enabled: boolean) => void;
  onStart: () => void;
  onRestart: () => void;
  onSelectScenario: (scenarioIndex: number) => void;
  onUpdate: (updater: (state: OfficialExamState) => OfficialExamState) => void;
}) {
  if (!state) {
    return (
      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-800">
            Official companion mode
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-950">
            {exam.title}
          </h2>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-700">
            {exam.description} Open the official AAMC PDF in another tab, then use
            this workspace to time the section, navigate all 30 scenarios, record
            your ratings, and optionally enter target ratings from your own official
            answer key for self-check scoring.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <StatCard label="Scenarios" value={exam.scenarioCount} />
            <StatCard label="Rating items" value={exam.itemCount} />
            <StatCard label="Optional timer" value={`${exam.durationMinutes} min`} />
          </div>
          <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
            The scenario text, response choices, answer key, and rationales stay in
            the official AAMC PDF. This app intentionally provides blank response
            slots only.
          </div>
        </div>
        <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-950">Start setup</h3>
          <a
            className="mt-4 flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            href={exam.officialUrl}
            rel="noreferrer"
            target="_blank"
          >
            <ExternalLink aria-hidden="true" size={16} />
            Open Official AAMC PDF
          </a>
          <label className="mt-4 flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
            <span>Use 75-minute timer</span>
            <input
              checked={timerDefault}
              className="h-4 w-4 accent-teal-700"
              type="checkbox"
              onChange={(event) => onTimerDefaultChange(event.target.checked)}
            />
          </label>
          <button
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800"
            onClick={onStart}
          >
            <Play aria-hidden="true" size={16} />
            Start {exam.title}
          </button>
        </aside>
      </section>
    );
  }

  const progress = examProgress(state);
  const keyProgress = examKeyProgress(state);
  const responseCount = state.itemCounts[selectedScenario] ?? 0;
  const isSubmitted = Boolean(state.submittedAt);

  function setItemCount(nextCount: number) {
    onUpdate((current) => {
      const nextCounts = [...current.itemCounts];
      nextCounts[selectedScenario] = Math.max(1, Math.min(12, nextCount));

      return { ...current, itemCounts: nextCounts };
    });
  }

  return (
    <section className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
      <aside className="space-y-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">{exam.title}</h2>
              <p className="text-sm text-slate-600">
                {progress.answeredItems} of {progress.totalItems} rated
              </p>
            </div>
            <p className={`text-2xl font-semibold ${percentageClass(progress.percentage)}`}>
              {progress.percentage}%
            </p>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-teal-700"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
          <a
            className="mt-4 flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            href={exam.officialUrl}
            rel="noreferrer"
            target="_blank"
          >
            <ExternalLink aria-hidden="true" size={16} />
            Official AAMC PDF
          </a>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="flex items-center gap-2 text-sm font-semibold text-slate-950">
            <Clock aria-hidden="true" size={16} />
            Timer
          </p>
          {state.timerEnabled ? (
            <>
              <p className="mt-3 text-4xl font-semibold text-slate-950">
                {formatTime(state.secondsRemaining)}
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  className="flex flex-1 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
                  disabled={isSubmitted || state.secondsRemaining <= 0}
                  onClick={() =>
                    onUpdate((current) => ({
                      ...current,
                      timerRunning: !current.timerRunning,
                    }))
                  }
                >
                  {state.timerRunning ? (
                    <Pause aria-hidden="true" size={16} />
                  ) : (
                    <Play aria-hidden="true" size={16} />
                  )}
                  {state.timerRunning ? "Pause" : "Resume"}
                </button>
                <button
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                  onClick={() =>
                    onUpdate((current) => ({
                      ...current,
                      secondsRemaining: exam.durationMinutes * 60,
                      timerRunning: current.timerEnabled && !current.submittedAt,
                    }))
                  }
                >
                  Reset
                </button>
              </div>
            </>
          ) : (
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Timer disabled for this attempt.
            </p>
          )}
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-slate-950">Scenarios</h3>
            <span className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
              {exam.scenarioCount}
            </span>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: exam.scenarioCount }, (_, index) => {
              const count = state.itemCounts[index] ?? 0;
              const answered = Array.from({ length: count }).filter(
                (_, itemIndex) => state.ratings[itemId(exam.id, index, itemIndex)],
              ).length;

              return (
                <button
                  key={index}
                  className={`rounded-md border px-2 py-2 text-sm font-semibold ${
                    selectedScenario === index
                      ? "border-teal-700 bg-teal-50 text-teal-900"
                      : answered === count
                        ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                  onClick={() => onSelectScenario(index)}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      <article className="space-y-4">
        <section className="rounded-md border border-slate-200 bg-white px-4 py-5 shadow-sm sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-4xl">
              <h2 className="text-xl font-bold text-black">
                Scenario {selectedScenario + 1} of {exam.scenarioCount}
              </h2>
              <p className="mt-3 text-base leading-snug text-black">
                Read the corresponding scenario and response choices in the official
                AAMC PDF. This companion does not reproduce official AAMC content.
              </p>
              <p className="mt-5 text-base italic leading-snug text-black">
                Please rate the effectiveness of each response to this situation.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2 text-xs font-semibold">
              <span className="rounded bg-slate-100 px-2.5 py-1 text-slate-700">
                {responseCount} response slots
              </span>
              {isSubmitted && (
                <span className="rounded bg-emerald-50 px-2.5 py-1 text-emerald-800">
                  Submitted
                </span>
              )}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            <span className="font-semibold text-slate-950">
              Response slots for this scenario:
            </span>
            <button
              className="rounded border border-slate-300 bg-white px-2 py-1 font-semibold disabled:opacity-50"
              disabled={isSubmitted}
              onClick={() => setItemCount(responseCount - 1)}
            >
              -
            </button>
            <span className="min-w-8 text-center font-semibold">{responseCount}</span>
            <button
              className="rounded border border-slate-300 bg-white px-2 py-1 font-semibold disabled:opacity-50"
              disabled={isSubmitted}
              onClick={() => setItemCount(responseCount + 1)}
            >
              +
            </button>
            <span>
              Adjust if the official PDF scenario has a different number of
              responses.
            </span>
          </div>

          <div className="mt-5 space-y-3">
            {Array.from({ length: responseCount }, (_, index) => {
              const id = itemId(exam.id, selectedScenario, index);

              return (
                <div key={id} className="assessment-response">
                  <p className="text-base leading-snug text-black">
                    {index + 1}. Response {index + 1} from the official PDF
                  </p>
                  <RatingButtons
                    disabled={isSubmitted}
                    groupName={id}
                    selected={state.ratings[id]}
                    onSelect={(rating) =>
                      onUpdate((current) => ({
                        ...current,
                        ratings: { ...current.ratings, [id]: rating },
                      }))
                    }
                  />
                  {isSubmitted && (
                    <div className="mt-2 rounded-md border border-slate-200 bg-white p-3">
                      <p className="text-sm font-semibold text-slate-950">
                        Optional self-check target from your official AAMC answer key
                      </p>
                      <RatingButtons
                        groupName={`${id}-target`}
                        selected={state.targets[id]}
                        onSelect={(rating) =>
                          onUpdate((current) => ({
                            ...current,
                            targets: { ...current.targets, [id]: rating },
                          }))
                        }
                      />
                      {state.ratings[id] && state.targets[id] && (
                        <p className="mt-2 text-sm text-slate-700">
                          Practice points:{" "}
                          <span className="font-semibold text-slate-950">
                            {scoreRating(state.ratings[id], state.targets[id])} / 1
                          </span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-950">
                Official exam companion
              </p>
              <p className="text-sm text-slate-600">
                Ratings are saved locally. Official content and official keys remain
                in the AAMC PDF.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {isSubmitted ? (
                <>
                  <button
                    className="flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                    onClick={onRestart}
                  >
                    <RotateCcw aria-hidden="true" size={16} />
                    Restart Exam
                  </button>
                </>
              ) : (
                <button
                  className="flex items-center gap-2 rounded-md bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                  disabled={progress.answeredItems === 0}
                  onClick={() =>
                    onUpdate((current) => ({
                      ...current,
                      timerRunning: false,
                      submittedAt: new Date().toISOString(),
                    }))
                  }
                >
                  <Check aria-hidden="true" size={16} />
                  Submit Exam Ratings
                </button>
              )}
            </div>
          </div>
        </section>

        {isSubmitted && (
          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Completed ratings
              </p>
              <p className="mt-2 text-4xl font-semibold text-slate-950">
                {progress.answeredItems}/{progress.totalItems}
              </p>
              <p className="mt-2 text-sm text-slate-700">
                Submitted {state.submittedAt ? new Date(state.submittedAt).toLocaleString() : ""}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Optional self-check score
              </p>
              <p className={`mt-2 text-4xl font-semibold ${percentageClass(keyProgress.percentage)}`}>
                {keyProgress.keyedItems > 0 ? `${keyProgress.percentage}%` : "--"}
              </p>
              <p className="mt-2 text-sm text-slate-700">
                {keyProgress.keyedItems > 0
                  ? `${keyProgress.totalScore} of ${keyProgress.maxScore} keyed items`
                  : "Enter target ratings from your official AAMC key to calculate this."}
              </p>
            </div>
          </section>
        )}
      </article>
    </section>
  );
}

function AiDrillWorkspace({
  category,
  difficulty,
  generatedScenarios,
  hardMode,
  isGenerating,
  generationError,
  selectedScenario,
  ratings,
  answeredCount,
  score,
  showWhy,
  onCategoryChange,
  onDifficultyChange,
  onHardModeChange,
  onGenerate,
  onSelectScenario,
  onRatingChange,
  onSubmit,
  onReset,
  onShowWhyChange,
  onGenerateSimilar,
}: {
  category: GenerationCategory;
  difficulty: DifficultyLevel;
  generatedScenarios: Scenario[];
  hardMode: boolean;
  isGenerating: boolean;
  generationError: string | null;
  selectedScenario: Scenario | null;
  ratings: Record<string, Rating>;
  answeredCount: number;
  score: ReturnType<typeof scoreScenario> | null;
  showWhy: boolean;
  onCategoryChange: (category: GenerationCategory) => void;
  onDifficultyChange: (difficulty: DifficultyLevel) => void;
  onHardModeChange: (value: boolean) => void;
  onGenerate: () => void;
  onSelectScenario: (scenarioId: string) => void;
  onRatingChange: (responseId: string, rating: Rating) => void;
  onSubmit: () => void;
  onReset: () => void;
  onShowWhyChange: (value: boolean) => void;
  onGenerateSimilar: () => void;
}) {
  return (
    <section className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="space-y-4">
        <GenerationPanel
          category={category}
          difficulty={difficulty}
          hardMode={hardMode}
          isGenerating={isGenerating}
          generationError={generationError}
          onCategoryChange={onCategoryChange}
          onDifficultyChange={onDifficultyChange}
          onHardModeChange={onHardModeChange}
          onGenerate={onGenerate}
        />
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-950">
              AI scenarios
            </h2>
            <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
              {generatedScenarios.length}
            </span>
          </div>
          {generatedScenarios.length === 0 ? (
            <EmptyState text="Generate an original AI scenario to start drilling." />
          ) : (
            <div className="max-h-[560px] space-y-2 overflow-y-auto pr-1">
              {generatedScenarios.map((scenario) => (
                <button
                  key={scenario.id}
                  className={`w-full rounded-md border p-3 text-left transition ${
                    scenario.id === selectedScenario?.id
                      ? "border-teal-600 bg-teal-50"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  }`}
                  onClick={() => onSelectScenario(scenario.id)}
                >
                  <p className="text-sm font-semibold text-slate-950">
                    {scenario.title}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    {scenario.competency_tested}
                  </p>
                  <span className="mt-2 inline-flex rounded bg-sky-50 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-sky-700">
                    {difficultyLabel(scenario.difficulty_level)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>
      </aside>
      {selectedScenario ? (
        <ScenarioDrill
          scenario={selectedScenario}
          scenarioNumber={
            generatedScenarios.findIndex((scenario) => scenario.id === selectedScenario.id) +
            1
          }
          scenarioTotal={generatedScenarios.length}
          ratings={ratings}
          answeredCount={answeredCount}
          hardMode={hardMode}
          score={score}
          showWhy={showWhy}
          isGenerating={isGenerating}
          onRatingChange={onRatingChange}
          onSubmit={onSubmit}
          onReset={onReset}
          onShowWhyChange={onShowWhyChange}
          onGenerateSimilar={onGenerateSimilar}
        />
      ) : (
        <section className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
          <Sparkles aria-hidden="true" className="mx-auto text-teal-700" size={28} />
          <h2 className="mt-3 text-xl font-semibold text-slate-950">
            No AI drill selected
          </h2>
          <p className="mt-2 text-slate-600">
            Generate a new original PREview-style scenario to use this mode.
          </p>
        </section>
      )}
    </section>
  );
}

function GenerationPanel({
  category,
  difficulty,
  hardMode,
  isGenerating,
  generationError,
  onCategoryChange,
  onDifficultyChange,
  onHardModeChange,
  onGenerate,
}: {
  category: GenerationCategory;
  difficulty: DifficultyLevel;
  hardMode: boolean;
  isGenerating: boolean;
  generationError: string | null;
  onCategoryChange: (category: GenerationCategory) => void;
  onDifficultyChange: (difficulty: DifficultyLevel) => void;
  onHardModeChange: (value: boolean) => void;
  onGenerate: () => void;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-950">AI generation</h2>
          <p className="text-sm text-slate-600">Original scenario practice</p>
        </div>
        <Sparkles aria-hidden="true" className="text-teal-700" size={20} />
      </div>
      <div className="space-y-3">
        <label className="block text-sm font-medium text-slate-700">
          Category
          <select
            className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950"
            value={category}
            onChange={(event) =>
              onCategoryChange(event.target.value as GenerationCategory)
            }
          >
            {generationCategories.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Difficulty
          <select
            className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950"
            value={difficulty}
            onChange={(event) =>
              onDifficultyChange(event.target.value as DifficultyLevel)
            }
          >
            {difficultyOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
          <span>Hard mode</span>
          <input
            checked={hardMode}
            className="h-4 w-4 accent-teal-700"
            type="checkbox"
            onChange={(event) => onHardModeChange(event.target.checked)}
          />
        </label>
        <button
          className="flex w-full items-center justify-center gap-2 rounded-md bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          disabled={isGenerating}
          onClick={onGenerate}
        >
          {isGenerating ? (
            <Loader2 aria-hidden="true" className="animate-spin" size={16} />
          ) : (
            <Sparkles aria-hidden="true" size={16} />
          )}
          Generate New Scenario
        </button>
        {generationError && (
          <div className="flex gap-2 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
            <AlertTriangle aria-hidden="true" className="mt-0.5 shrink-0" size={16} />
            <p>{generationError}</p>
          </div>
        )}
      </div>
    </section>
  );
}

function ScenarioDrill({
  scenario,
  scenarioNumber,
  scenarioTotal,
  ratings,
  answeredCount,
  hardMode,
  score,
  showWhy,
  isGenerating,
  onRatingChange,
  onSubmit,
  onReset,
  onShowWhyChange,
  onGenerateSimilar,
}: {
  scenario: Scenario;
  scenarioNumber: number;
  scenarioTotal: number;
  ratings: Record<string, Rating>;
  answeredCount: number;
  hardMode: boolean;
  score: ReturnType<typeof scoreScenario> | null;
  showWhy: boolean;
  isGenerating: boolean;
  onRatingChange: (responseId: string, rating: Rating) => void;
  onSubmit: () => void;
  onReset: () => void;
  onShowWhyChange: (value: boolean) => void;
  onGenerateSimilar: () => void;
}) {
  const allAnswered = answeredCount === scenario.responses.length;

  return (
    <article className="space-y-4">
      <section className="rounded-md border border-slate-200 bg-white px-4 py-5 shadow-sm sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-4xl">
            <h2 className="text-xl font-bold text-black">
              Scenario {scenarioNumber} of {scenarioTotal}
            </h2>
            <p className="mt-3 text-base leading-snug text-black">
              {scenario.scenario_text}
            </p>
            <p className="mt-5 text-base italic leading-snug text-black">
              Please rate the effectiveness of each response to this situation.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded bg-slate-100 px-2.5 py-1 text-slate-700">
              {answeredCount}/{scenario.responses.length} rated
            </span>
            <span className="rounded bg-slate-100 px-2.5 py-1 text-slate-700">
              {difficultyLabel(scenario.difficulty_level)}
            </span>
            {hardMode && !score && (
              <span className="rounded bg-amber-50 px-2.5 py-1 text-amber-800">
                Hard mode
              </span>
            )}
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {scenario.responses.map((response, index) => {
            const selected = ratings[response.id];
            const result = score?.responses.find(
              (item) => item.responseId === response.id,
            );

            return (
              <div
                key={response.id}
                className={`assessment-response ${
                  result?.resultLabel === "Correct"
                    ? "assessment-result-correct"
                    : result?.resultLabel === "Partial credit"
                      ? "assessment-result-partial"
                      : result?.resultLabel === "Incorrect"
                        ? "assessment-result-incorrect"
                        : ""
                }`}
              >
                <p className="text-base leading-snug text-black">
                  {index + 1}. {response.response_text}
                </p>
                <RatingButtons
                  selected={selected}
                  disabled={Boolean(score)}
                  groupName={response.id}
                  onSelect={(rating) => onRatingChange(response.id, rating)}
                />

                {result && (
                  <div className="mt-3 border-l-4 border-current/20 bg-white p-3">
                    <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
                      <ResultMetric label="Result" value={result.resultLabel} />
                      <ResultMetric
                        label="Your rating"
                        value={formatRating(result.userRating)}
                      />
                      <ResultMetric
                        label="Target rating"
                        value={formatRating(result.targetRating)}
                      />
                      <ResultMetric
                        label="Points"
                        value={`${result.pointsEarned} / 1`}
                      />
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-800">
                      <span className="font-semibold text-slate-950">
                        Rationale:{" "}
                      </span>
                      {result.explanation}
                    </p>
                    {showWhy && (
                      <p className="mt-3 bg-slate-50 p-3 text-sm leading-6 text-slate-800">
                        <span className="font-semibold text-slate-950">
                          Why this rating:{" "}
                        </span>
                        {adjacentRatingGuidance(result.targetRating)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-950">
              Practice scoring, not official AAMC scoring
            </p>
            <p className="text-sm text-slate-600">
              Exact match = 1 point, one rating away = 0.5, two or more away = 0.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {score ? (
              <>
                <button
                  className="flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                  onClick={() => onShowWhyChange(!showWhy)}
                >
                  {showWhy ? "Hide Why" : "Why This Rating?"}
                </button>
                <button
                  className="flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                  onClick={onReset}
                >
                  <RotateCcw aria-hidden="true" size={16} />
                  Retry Scenario
                </button>
                <button
                  className="flex items-center gap-2 rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:bg-slate-400"
                  disabled={isGenerating}
                  onClick={onGenerateSimilar}
                >
                  {isGenerating ? (
                    <Loader2 aria-hidden="true" className="animate-spin" size={16} />
                  ) : (
                    <RefreshCcw aria-hidden="true" size={16} />
                  )}
                  Generate Similar
                </button>
              </>
            ) : (
              <button
                className="flex items-center gap-2 rounded-md bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                disabled={!allAnswered}
                onClick={onSubmit}
              >
                <Check aria-hidden="true" size={16} />
                Submit Scenario
              </button>
            )}
          </div>
        </div>
      </section>

      {score && (
        <section className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Score summary
            </p>
            <p
              className={`mt-2 text-4xl font-semibold ${percentageClass(
                score.percentage,
              )}`}
            >
              {score.percentage}%
            </p>
            <p className="mt-2 text-sm text-slate-700">
              {score.totalScore} of {score.maxScore} practice points
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Strategy takeaway
            </p>
            <p className="mt-2 text-base leading-7 text-slate-750">
              {scenario.overall_takeaway}
            </p>
          </div>
        </section>
      )}
    </article>
  );
}

function RatingButtons({
  selected,
  disabled = false,
  groupName,
  onSelect,
}: {
  selected?: Rating;
  disabled?: boolean;
  groupName?: string;
  onSelect: (rating: Rating) => void;
}) {
  const ratings: Rating[] = [1, 2, 3, 4];

  return (
    <div className="mt-2 grid grid-cols-4 bg-[#f4f4f4] px-2 py-1.5">
      {ratings.map((rating) => (
        <label
          key={rating}
          className="flex min-h-11 cursor-pointer flex-col items-center justify-between gap-1 text-center text-sm leading-tight text-black"
        >
          <span>{ratingLabels[rating]}</span>
          <input
            checked={selected === rating}
            className="h-7 w-7 cursor-pointer accent-slate-700 disabled:cursor-not-allowed"
            disabled={disabled}
            name={groupName}
            title={formatRating(rating)}
            type="radio"
            onChange={() => onSelect(rating)}
          />
        </label>
      ))}
    </div>
  );
}

function ResultMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white/75 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function Dashboard({
  aiHistory,
  officialStates,
  onExport,
  onClear,
}: {
  aiHistory: StoredAttempt[];
  officialStates: Partial<Record<OfficialPracticeExam["id"], OfficialExamState>>;
  onExport: () => void;
  onClear: () => void;
}) {
  const officialSummaries = officialPracticeExams.map((exam) => {
    const state = officialStates[exam.id];
    const progress = state
      ? examProgress(state)
      : { answeredItems: 0, totalItems: exam.itemCount, percentage: 0 };
    const keyProgress = state
      ? examKeyProgress(state)
      : { keyedItems: 0, totalScore: 0, maxScore: 0, percentage: 0 };

    return { exam, state, progress, keyProgress };
  });
  const aiAverage =
    aiHistory.length > 0
      ? Math.round(
          aiHistory.reduce((total, attempt) => total + attempt.percentage, 0) /
            aiHistory.length,
        )
      : 0;

  return (
    <section className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Official exams started"
          value={officialSummaries.filter((summary) => summary.state).length}
        />
        <StatCard label="AI drills completed" value={aiHistory.length} />
        <StatCard label="AI average" value={`${aiAverage}%`} />
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              Official exam companion progress
            </h2>
            <p className="text-sm text-slate-600">
              Official AAMC content is not stored here; only your local ratings and
              optional self-check targets are saved.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              onClick={onExport}
            >
              <Download aria-hidden="true" size={16} />
              Export CSV
            </button>
            <button
              className="flex items-center gap-2 rounded-md border border-rose-200 bg-white px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50"
              onClick={onClear}
            >
              <Trash2 aria-hidden="true" size={16} />
              Clear
            </button>
          </div>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {officialSummaries.map(({ exam, state, progress, keyProgress }) => (
            <div
              key={exam.id}
              className="rounded-lg border border-slate-200 bg-slate-50 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-950">{exam.title}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {progress.answeredItems} of {progress.totalItems} ratings saved
                  </p>
                </div>
                <p
                  className={`text-xl font-semibold ${percentageClass(
                    progress.percentage,
                  )}`}
                >
                  {progress.percentage}%
                </p>
              </div>
              <p className="mt-3 text-sm text-slate-700">
                Status: {state?.submittedAt ? "submitted" : state ? "in progress" : "not started"}
              </p>
              <p className="mt-1 text-sm text-slate-700">
                Self-check keyed: {keyProgress.keyedItems} item
                {keyProgress.keyedItems === 1 ? "" : "s"}
                {keyProgress.keyedItems > 0
                  ? `, ${keyProgress.percentage}% practice score`
                  : ""}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">AI drill history</h2>
        <div className="mt-4 space-y-3">
          {aiHistory.length === 0 ? (
            <EmptyState text="AI drill attempts will appear after you submit a generated scenario." />
          ) : (
            aiHistory.slice(0, 8).map((attempt) => (
              <div
                key={attempt.id}
                className="rounded-lg border border-slate-200 bg-white p-4"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-slate-950">
                      {attempt.scenarioTitle}
                    </p>
                    <p className="text-sm text-slate-600">
                      {new Date(attempt.dateCompleted).toLocaleString()} -{" "}
                      {attempt.competencyTested}
                    </p>
                  </div>
                  <p
                    className={`text-lg font-semibold ${percentageClass(
                      attempt.percentage,
                    )}`}
                  >
                    {attempt.percentage}%
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
      {text}
    </div>
  );
}
