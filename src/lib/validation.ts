import {
  DifficultyLevel,
  Rating,
  Scenario,
  SourceType,
} from "@/types/scenario";

const validDifficulties: DifficultyLevel[] = [
  "easy",
  "medium",
  "hard",
  "aamc_like_mixed",
];

const validRatings: Rating[] = [1, 2, 3, 4];
const responseTextMaxChars = 150;
const responseTextMaxWords = 24;

type GeneratedScenario = Omit<Scenario, "source_type" | "responses"> & {
  source_type?: SourceType;
  responses: Array<{
    id?: string;
    response_text: string;
    target_rating: Rating;
    explanation: string;
  }>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function wordCount(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function isMonotonicRatingPattern(ratings: Rating[]) {
  const ascending = ratings.every(
    (rating, index) => index === 0 || rating >= ratings[index - 1],
  );
  const descending = ratings.every(
    (rating, index) => index === 0 || rating <= ratings[index - 1],
  );

  return ascending || descending;
}

function ratingDistributionErrors(responses: GeneratedScenario["responses"]) {
  const ratings = responses.map((response) => response.target_rating);
  const distinctRatings = new Set(ratings);
  const maxSameRating = Math.max(
    ...validRatings.map(
      (rating) => ratings.filter((targetRating) => targetRating === rating).length,
    ),
  );
  const errors: string[] = [];

  if (!distinctRatings.has(1) || !distinctRatings.has(4)) {
    errors.push("Scenario must include at least one 1 rating and one 4 rating.");
  }

  if (distinctRatings.size < 3) {
    errors.push("Scenario must use at least three distinct target ratings.");
  }

  if (maxSameRating > Math.ceil(responses.length / 2)) {
    errors.push("No single target rating should dominate the scenario.");
  }

  if (isMonotonicRatingPattern(ratings)) {
    errors.push("Target ratings must not be ordered from weakest to strongest.");
  }

  return errors;
}

export function parseJsonObject(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    const firstBrace = raw.indexOf("{");
    const lastBrace = raw.lastIndexOf("}");

    if (firstBrace >= 0 && lastBrace > firstBrace) {
      return JSON.parse(raw.slice(firstBrace, lastBrace + 1));
    }

    throw new Error("The AI response was not valid JSON.");
  }
}

export function normalizeScenario(
  value: unknown,
  fallbackSource: SourceType = "ai_generated",
): { scenario: Scenario | null; errors: string[] } {
  const errors: string[] = [];

  if (!isRecord(value)) {
    return { scenario: null, errors: ["Scenario must be a JSON object."] };
  }

  const candidate = value as Partial<GeneratedScenario>;

  if (!isNonEmptyString(candidate.id)) {
    errors.push("Scenario is missing an id.");
  }

  if (!isNonEmptyString(candidate.title)) {
    errors.push("Scenario is missing a title.");
  }

  if (!isNonEmptyString(candidate.scenario_text)) {
    errors.push("Scenario is missing scenario_text.");
  }

  if (!isNonEmptyString(candidate.competency_tested)) {
    errors.push("Scenario is missing competency_tested.");
  }

  if (
    !isNonEmptyString(candidate.difficulty_level) ||
    !validDifficulties.includes(candidate.difficulty_level as DifficultyLevel)
  ) {
    errors.push("Scenario has an invalid difficulty_level.");
  }

  if (!Array.isArray(candidate.responses)) {
    errors.push("Scenario is missing responses.");
  } else if (candidate.responses.length < 4 || candidate.responses.length > 8) {
    errors.push("Scenario must include 4 to 8 responses.");
  } else {
    candidate.responses.forEach((response, index) => {
      if (!isNonEmptyString(response.response_text)) {
        errors.push(`Response ${index + 1} is missing response_text.`);
      } else {
        const responseText = response.response_text.trim();

        if (responseText.length > responseTextMaxChars) {
          errors.push(
            `Response ${index + 1} must be ${responseTextMaxChars} characters or fewer.`,
          );
        }

        if (wordCount(responseText) > responseTextMaxWords) {
          errors.push(
            `Response ${index + 1} must be ${responseTextMaxWords} words or fewer.`,
          );
        }
      }

      if (!validRatings.includes(response.target_rating)) {
        errors.push(`Response ${index + 1} has an invalid target_rating.`);
      }

      if (!isNonEmptyString(response.explanation)) {
        errors.push(`Response ${index + 1} is missing an explanation.`);
      }
    });
    errors.push(...ratingDistributionErrors(candidate.responses));
  }

  if (!isNonEmptyString(candidate.overall_takeaway)) {
    errors.push("Scenario is missing overall_takeaway.");
  }

  if (errors.length > 0) {
    return { scenario: null, errors };
  }

  const scenario: Scenario = {
    id: candidate.id!.trim(),
    title: candidate.title!.trim(),
    scenario_text: candidate.scenario_text!.trim(),
    competency_tested: candidate.competency_tested!.trim(),
    difficulty_level: candidate.difficulty_level as DifficultyLevel,
    source_type:
      candidate.source_type === "ai_generated"
        ? candidate.source_type
        : fallbackSource,
    responses: candidate.responses!.map((response, index) => ({
      id: response.id?.trim() || `${candidate.id}-r${index + 1}`,
      response_text: response.response_text.trim(),
      target_rating: response.target_rating,
      explanation: response.explanation.trim(),
    })),
    overall_takeaway: candidate.overall_takeaway!.trim(),
  };

  return { scenario, errors: [] };
}
