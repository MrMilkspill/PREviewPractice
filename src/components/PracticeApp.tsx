"use client";

import {
  Activity,
  AlertTriangle,
  BarChart3,
  BookOpenCheck,
  Check,
  ChevronRight,
  Download,
  History,
  Lightbulb,
  Loader2,
  RefreshCcw,
  RotateCcw,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { preloadedScenarios } from "@/data/preloadedScenarios";
import { difficultyOptions } from "@/data/options";
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
  ResponseResult,
  Scenario,
  StoredAttempt,
  generationCategories,
  ratingLabels,
} from "@/types/scenario";

const historyKey = "preview-scenario-drills-history-v1";
const generatedKey = "preview-scenario-drills-generated-v1";

type ViewMode = "practice" | "dashboard" | "missed";

interface MissedReviewItem extends ResponseResult {
  reviewKey: string;
  attemptId: string;
  scenarioTitle: string;
  scenarioText: string;
  competencyTested: string;
  difficultyLevel: DifficultyLevel;
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

function createMissedReviewAttempt(
  reviewItems: MissedReviewItem[],
  results: MissedReviewItem[],
): StoredAttempt {
  const totalScore = results.reduce((total, item) => total + item.pointsEarned, 0);

  return {
    id: `missed-review-${Date.now()}`,
    scenarioId: "missed-review",
    scenarioTitle: "Missed-response review",
    scenarioText: "Targeted review of previously missed response ratings.",
    dateCompleted: new Date().toISOString(),
    competencyTested: "Mixed missed responses",
    difficultyLevel: "aamc_like_mixed",
    sourceType: "missed_review",
    totalScore,
    maxScore: reviewItems.length,
    percentage: Math.round((totalScore / reviewItems.length) * 100),
    responses: results,
    missedResponses: results.filter((item) => item.pointsEarned < 1),
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

function toCsvValue(value: string | number): string {
  const text = String(value).replaceAll('"', '""');
  return `"${text}"`;
}

export function PracticeApp() {
  const [viewMode, setViewMode] = useState<ViewMode>("practice");
  const [scenarios, setScenarios] = useState<Scenario[]>(preloadedScenarios);
  const [selectedScenarioId, setSelectedScenarioId] = useState(preloadedScenarios[0].id);
  const [ratings, setRatings] = useState<Record<string, Rating>>({});
  const [score, setScore] = useState<ReturnType<typeof scoreScenario> | null>(null);
  const [history, setHistory] = useState<StoredAttempt[]>([]);
  const [category, setCategory] = useState<GenerationCategory>("Random mixed");
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("aamc_like_mixed");
  const [hardMode, setHardMode] = useState(false);
  const [showWhy, setShowWhy] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const savedHistory = window.localStorage.getItem(historyKey);
      const savedGenerated = window.localStorage.getItem(generatedKey);

      if (savedHistory) {
        try {
          setHistory(JSON.parse(savedHistory) as StoredAttempt[]);
        } catch {
          setHistory([]);
        }
      }

      if (savedGenerated) {
        try {
          const generated = JSON.parse(savedGenerated) as Scenario[];
          setScenarios([...generated, ...preloadedScenarios]);
          if (generated.length > 0) {
            setSelectedScenarioId(generated[0].id);
          }
        } catch {
          setScenarios(preloadedScenarios);
        }
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const selectedScenario = useMemo(
    () => scenarios.find((scenario) => scenario.id === selectedScenarioId) ?? scenarios[0],
    [scenarios, selectedScenarioId],
  );
  const selectedScenarioIndex = scenarios.findIndex(
    (scenario) => scenario.id === selectedScenario.id,
  );

  const answeredCount = selectedScenario.responses.filter(
    (response) => ratings[response.id],
  ).length;
  const allAnswered = answeredCount === selectedScenario.responses.length;

  const missedItems = useMemo<MissedReviewItem[]>(
    () =>
      history
        .filter((attempt) => attempt.sourceType !== "missed_review")
        .flatMap((attempt) =>
          attempt.missedResponses.map((response) => ({
            ...response,
            reviewKey: `${attempt.id}-${response.responseId}`,
            attemptId: attempt.id,
            scenarioTitle: attempt.scenarioTitle,
            scenarioText: attempt.scenarioText,
            competencyTested: attempt.competencyTested,
            difficultyLevel: attempt.difficultyLevel,
          })),
        )
        .reverse(),
    [history],
  );

  function persistHistory(nextHistory: StoredAttempt[]) {
    setHistory(nextHistory);
    window.localStorage.setItem(historyKey, JSON.stringify(nextHistory));
  }

  function persistGenerated(nextScenarios: Scenario[]) {
    const generated = nextScenarios.filter(
      (scenario) => scenario.source_type === "ai_generated",
    );
    window.localStorage.setItem(generatedKey, JSON.stringify(generated));
  }

  function resetScenarioState(scenarioId: string) {
    setSelectedScenarioId(scenarioId);
    setRatings({});
    setScore(null);
    setShowWhy(false);
    setViewMode("practice");
  }

  function submitScenario() {
    if (!allAnswered) {
      return;
    }

    const nextScore = scoreScenario(selectedScenario, ratings);
    setScore(nextScore);
    const attempt = createAttempt(selectedScenario, nextScore);
    persistHistory([attempt, ...history]);
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

      const nextScenarios = [payload.scenario, ...scenarios];
      setScenarios(nextScenarios);
      persistGenerated(nextScenarios);
      resetScenarioState(payload.scenario.id);
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

  function exportCsv() {
    const rows = history.flatMap((attempt) =>
      attempt.responses.map((response) => [
        attempt.dateCompleted,
        attempt.scenarioTitle,
        attempt.competencyTested,
        difficultyLabel(attempt.difficultyLevel),
        attempt.sourceType,
        attempt.totalScore,
        attempt.maxScore,
        attempt.percentage,
        response.responseText,
        formatRating(response.userRating),
        formatRating(response.targetRating),
        response.pointsEarned,
        response.resultLabel,
      ]),
    );

    const header = [
      "date_completed",
      "scenario_title",
      "competency",
      "difficulty",
      "source_type",
      "scenario_score",
      "max_score",
      "percentage",
      "response",
      "user_rating",
      "target_rating",
      "points_earned",
      "result",
    ];

    const csv = [
      header.map(toCsvValue).join(","),
      ...rows.map((row) => row.map(toCsvValue).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "preview-scenario-drills-history.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function clearHistory() {
    const confirmed = window.confirm(
      "Clear all saved PREview Scenario Drills performance history?",
    );

    if (confirmed) {
      persistHistory([]);
    }
  }

  return (
    <main className="min-h-screen">
      <header className="border-b border-slate-200 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-teal-700 text-white">
                  <BookOpenCheck aria-hidden="true" size={23} />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold tracking-normal text-slate-950 sm:text-3xl">
                    PREview Scenario Drills
                  </h1>
                  <p className="text-sm font-medium text-slate-600">
                    Practice one scenario at a time
                  </p>
                </div>
              </div>
            </div>
            <nav className="grid grid-cols-3 gap-2 rounded-lg border border-slate-200 bg-slate-50 p-1 text-sm font-medium">
              <button
                className={`flex items-center justify-center gap-2 rounded-md px-3 py-2 ${
                  viewMode === "practice"
                    ? "bg-white text-teal-800 shadow-sm"
                    : "text-slate-600 hover:text-slate-950"
                }`}
                onClick={() => setViewMode("practice")}
              >
                <Activity aria-hidden="true" size={16} />
                Drill
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
              <button
                className={`flex items-center justify-center gap-2 rounded-md px-3 py-2 ${
                  viewMode === "missed"
                    ? "bg-white text-teal-800 shadow-sm"
                    : "text-slate-600 hover:text-slate-950"
                }`}
                onClick={() => setViewMode("missed")}
              >
                <History aria-hidden="true" size={16} />
                Missed
              </button>
            </nav>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            This is an unofficial PREview practice tool. It does not contain official
            AAMC questions and is not affiliated with or endorsed by AAMC. Use
            official AAMC materials for the most accurate preparation.
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:px-8">
        <aside className="space-y-4">
          <GenerationPanel
            category={category}
            difficulty={difficulty}
            hardMode={hardMode}
            isGenerating={isGenerating}
            generationError={generationError}
            onCategoryChange={setCategory}
            onDifficultyChange={setDifficulty}
            onHardModeChange={setHardMode}
            onGenerate={() => generateScenario()}
          />

          <ScenarioList
            scenarios={scenarios}
            selectedScenarioId={selectedScenario.id}
            onSelect={resetScenarioState}
          />
        </aside>

        <section className="min-w-0">
          {viewMode === "practice" && (
            <ScenarioDrill
              scenario={selectedScenario}
              scenarioNumber={selectedScenarioIndex >= 0 ? selectedScenarioIndex + 1 : 1}
              scenarioTotal={scenarios.length}
              ratings={ratings}
              answeredCount={answeredCount}
              hardMode={hardMode}
              score={score}
              showWhy={showWhy}
              isGenerating={isGenerating}
              onRatingChange={(responseId, rating) =>
                setRatings((current) => ({ ...current, [responseId]: rating }))
              }
              onSubmit={submitScenario}
              onReset={() => {
                setRatings({});
                setScore(null);
                setShowWhy(false);
              }}
              onShowWhyChange={setShowWhy}
              onGenerateSimilar={() => generateScenario(selectedScenario)}
            />
          )}

          {viewMode === "dashboard" && (
            <Dashboard
              history={history}
              missedCount={missedItems.length}
              onExport={exportCsv}
              onClear={clearHistory}
              onReviewMissed={() => setViewMode("missed")}
            />
          )}

          {viewMode === "missed" && (
            <MissedReview
              items={missedItems}
              onSaveAttempt={(attempt) => persistHistory([attempt, ...history])}
            />
          )}
        </section>
      </div>
    </main>
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

function ScenarioList({
  scenarios,
  selectedScenarioId,
  onSelect,
}: {
  scenarios: Scenario[];
  selectedScenarioId: string;
  onSelect: (scenarioId: string) => void;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-950">Scenario list</h2>
        <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
          {scenarios.length}
        </span>
      </div>
      <div className="max-h-[560px] space-y-2 overflow-y-auto pr-1">
        {scenarios.map((scenario) => (
          <button
            key={scenario.id}
            className={`w-full rounded-md border p-3 text-left transition ${
              scenario.id === selectedScenarioId
                ? "border-teal-600 bg-teal-50"
                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
            }`}
            onClick={() => onSelect(scenario.id)}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-950">
                  {scenario.title}
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  {scenario.competency_tested}
                </p>
              </div>
              <ChevronRight aria-hidden="true" className="mt-0.5 shrink-0" size={16} />
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="rounded bg-slate-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                {scenario.source_type === "ai_generated" ? "AI" : "Preloaded"}
              </span>
              <span className="rounded bg-sky-50 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-sky-700">
                {difficultyLabel(scenario.difficulty_level)}
              </span>
            </div>
          </button>
        ))}
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
                  <Lightbulb aria-hidden="true" size={16} />
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
            <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
              <Lightbulb aria-hidden="true" size={16} />
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
  disabled,
  groupName,
  onSelect,
}: {
  selected?: Rating;
  disabled: boolean;
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
  history,
  missedCount,
  onExport,
  onClear,
  onReviewMissed,
}: {
  history: StoredAttempt[];
  missedCount: number;
  onExport: () => void;
  onClear: () => void;
  onReviewMissed: () => void;
}) {
  const completed = history.filter((attempt) => attempt.sourceType !== "missed_review");
  const average =
    completed.length > 0
      ? Math.round(
          completed.reduce((total, attempt) => total + attempt.percentage, 0) /
            completed.length,
        )
      : 0;
  const totalResponses = completed.reduce(
    (total, attempt) => total + attempt.responses.length,
    0,
  );
  const byCompetency = Array.from(
    completed
      .reduce((map, attempt) => {
        const current = map.get(attempt.competencyTested) ?? {
          total: 0,
          count: 0,
        };
        current.total += attempt.percentage;
        current.count += 1;
        map.set(attempt.competencyTested, current);
        return map;
      }, new Map<string, { total: number; count: number }>())
      .entries(),
  )
    .map(([competency, value]) => ({
      competency,
      average: Math.round(value.total / value.count),
      count: value.count,
    }))
    .sort((a, b) => b.average - a.average);
  const sourceBreakdown = ["preloaded", "ai_generated"].map((source) => {
    const attempts = completed.filter((attempt) => attempt.sourceType === source);
    const sourceAverage =
      attempts.length > 0
        ? Math.round(
            attempts.reduce((total, attempt) => total + attempt.percentage, 0) /
              attempts.length,
          )
        : 0;

    return {
      source,
      attempts: attempts.length,
      average: sourceAverage,
    };
  });

  return (
    <section className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Average score" value={`${average}%`} />
        <StatCard label="Scenarios completed" value={completed.length} />
        <StatCard label="Responses rated" value={totalResponses} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Weak areas</h2>
          <div className="mt-4 space-y-3">
            {byCompetency.length === 0 ? (
              <EmptyState text="Complete a scenario to see competency trends." />
            ) : (
              [...byCompetency].reverse().slice(0, 5).map((item) => (
                <CompetencyRow key={item.competency} item={item} />
              ))
            )}
          </div>
        </section>
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Best areas</h2>
          <div className="mt-4 space-y-3">
            {byCompetency.length === 0 ? (
              <EmptyState text="Your highest competency averages will appear here." />
            ) : (
              byCompetency.slice(0, 5).map((item) => (
                <CompetencyRow key={item.competency} item={item} />
              ))
            )}
          </div>
        </section>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              Performance history
            </h2>
            <p className="text-sm text-slate-600">
              Saved in this browser with localStorage.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
              disabled={history.length === 0}
              onClick={onExport}
            >
              <Download aria-hidden="true" size={16} />
              Export CSV
            </button>
            <button
              className="flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
              disabled={missedCount === 0}
              onClick={onReviewMissed}
            >
              <RefreshCcw aria-hidden="true" size={16} />
              Review missed ({missedCount})
            </button>
            <button
              className="flex items-center gap-2 rounded-md border border-rose-200 bg-white px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
              disabled={history.length === 0}
              onClick={onClear}
            >
              <Trash2 aria-hidden="true" size={16} />
              Clear
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {sourceBreakdown.map((source) => (
            <div
              key={source.source}
              className="rounded-lg border border-slate-200 bg-slate-50 p-4"
            >
              <p className="text-sm font-semibold text-slate-950">
                {source.source === "preloaded" ? "Preloaded" : "AI-generated"}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {source.attempts} attempts, {source.average}% average
              </p>
            </div>
          ))}
        </div>

        <div className="mt-5 space-y-3">
          {history.length === 0 ? (
            <EmptyState text="Recent attempts will appear after you submit a scenario." />
          ) : (
            history.slice(0, 8).map((attempt) => (
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
                {attempt.missedResponses.length > 0 && (
                  <p className="mt-2 text-sm text-slate-600">
                    Missed or partial: {attempt.missedResponses.length} response
                    {attempt.missedResponses.length === 1 ? "" : "s"}
                  </p>
                )}
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

function CompetencyRow({
  item,
}: {
  item: { competency: string; average: number; count: number };
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-slate-800">{item.competency}</span>
        <span className={`font-semibold ${percentageClass(item.average)}`}>
          {item.average}%
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-teal-700"
          style={{ width: `${item.average}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-slate-500">{item.count} attempt(s)</p>
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

function MissedReview({
  items,
  onSaveAttempt,
}: {
  items: MissedReviewItem[];
  onSaveAttempt: (attempt: StoredAttempt) => void;
}) {
  const [answers, setAnswers] = useState<Record<string, Rating>>({});
  const [submitted, setSubmitted] = useState(false);

  const reviewItems = items.slice(0, 20);
  const allAnswered = reviewItems.every((item) => answers[item.reviewKey]);

  function buildResults() {
    return reviewItems.map((item) => {
      const userRating = answers[item.reviewKey];
      const pointsEarned = scoreRating(userRating, item.targetRating);

      return {
        ...item,
        userRating,
        pointsEarned,
        resultLabel:
          pointsEarned === 1
            ? "Correct"
            : pointsEarned === 0.5
              ? "Partial credit"
              : "Incorrect",
      } satisfies MissedReviewItem;
    });
  }

  const results = submitted ? buildResults() : [];

  function submitMissedReview() {
    const nextResults = buildResults();
    setSubmitted(true);
    onSaveAttempt(createMissedReviewAttempt(reviewItems, nextResults));
  }

  if (reviewItems.length === 0) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h2 className="text-xl font-semibold text-slate-950">No missed items yet</h2>
        <p className="mt-2 text-slate-600">
          Submit scenarios with missed or partial-credit responses to unlock targeted
          review.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-950">
          Review missed items
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Reattempt up to 20 recent missed or partial-credit response ratings. Each
          item keeps its original scenario context.
        </p>
      </div>

      {reviewItems.map((item, index) => {
        const result = results.find(
          (resultItem) => resultItem.reviewKey === item.reviewKey,
        );

        return (
          <div
            key={item.reviewKey}
            className={`rounded-lg border bg-white p-4 shadow-sm ${
              result?.resultLabel === "Correct"
                ? "result-correct"
                : result?.resultLabel === "Partial credit"
                  ? "result-partial"
                  : result?.resultLabel === "Incorrect"
                    ? "result-incorrect"
                    : "border-slate-200"
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Missed item {index + 1} - {item.competencyTested}
            </p>
            <h3 className="mt-1 font-semibold text-slate-950">
              {item.scenarioTitle}
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              {item.scenarioText}
            </p>
            <p className="mt-3 text-base leading-7 text-slate-950">
              {item.responseText}
            </p>
            <div className="mt-4">
              <RatingButtons
                disabled={submitted}
                groupName={item.reviewKey}
                selected={answers[item.reviewKey]}
                onSelect={(rating) =>
                  setAnswers((current) => ({
                    ...current,
                    [item.reviewKey]: rating,
                  }))
                }
              />
            </div>
            {result && (
              <div className="mt-4 border-t border-current/10 pt-4 text-sm leading-6 text-slate-700">
                <p>
                  <span className="font-semibold text-slate-950">Result: </span>
                  {result.resultLabel} - {result.pointsEarned} / 1 point
                </p>
                <p>
                  <span className="font-semibold text-slate-950">Target: </span>
                  {formatRating(result.targetRating)}
                </p>
                <p className="mt-2">
                  <span className="font-semibold text-slate-950">Rationale: </span>
                  {result.explanation}
                </p>
              </div>
            )}
          </div>
        );
      })}

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-600">
            {Object.keys(answers).length} of {reviewItems.length} answered
          </p>
          {submitted ? (
            <button
              className="flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              onClick={() => {
                setAnswers({});
                setSubmitted(false);
              }}
            >
              <RotateCcw aria-hidden="true" size={16} />
              Retry Missed Set
            </button>
          ) : (
            <button
              className="flex items-center gap-2 rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              disabled={!allAnswered}
              onClick={submitMissedReview}
            >
              <Check aria-hidden="true" size={16} />
              Submit Missed Review
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
