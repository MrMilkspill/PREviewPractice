export const ratingLabels = {
  1: "Very Ineffective",
  2: "Ineffective",
  3: "Effective",
  4: "Very Effective",
} as const;

export type Rating = keyof typeof ratingLabels;

export type DifficultyLevel =
  | "easy"
  | "medium"
  | "hard"
  | "aamc_like_mixed";

export type SourceType = "ai_generated";

export const generationCategories = [
  "Academic responsibility",
  "Peer conflict",
  "Teamwork",
  "Patient or volunteer interaction",
  "Confidentiality",
  "Feedback and improvement",
  "Cultural humility",
  "Professional boundaries",
  "Reliability and dependability",
  "Ethical responsibility",
  "Research integrity",
  "Communication with supervisors",
  "Handling mistakes",
  "Scheduling or commitment conflicts",
  "Witnessing unprofessional behavior",
  "Random mixed",
] as const;

export type GenerationCategory = (typeof generationCategories)[number];

export interface ScenarioResponse {
  id: string;
  response_text: string;
  target_rating: Rating;
  explanation: string;
}

export interface Scenario {
  id: string;
  title: string;
  scenario_text: string;
  competency_tested: string;
  difficulty_level: DifficultyLevel;
  source_type: SourceType;
  responses: ScenarioResponse[];
  overall_takeaway: string;
}

export interface ResponseResult {
  responseId: string;
  responseText: string;
  userRating: Rating;
  targetRating: Rating;
  pointsEarned: number;
  explanation: string;
  resultLabel: "Correct" | "Partial credit" | "Incorrect";
}

export interface ScenarioScore {
  totalScore: number;
  maxScore: number;
  percentage: number;
  responses: ResponseResult[];
}

export interface StoredAttempt {
  id: string;
  scenarioId: string;
  scenarioTitle: string;
  scenarioText: string;
  dateCompleted: string;
  competencyTested: string;
  difficultyLevel: DifficultyLevel;
  sourceType: SourceType | "missed_review";
  totalScore: number;
  maxScore: number;
  percentage: number;
  responses: ResponseResult[];
  missedResponses: ResponseResult[];
}
