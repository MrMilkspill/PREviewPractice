import {
  Rating,
  ResponseResult,
  Scenario,
  ScenarioScore,
  ratingLabels,
} from "@/types/scenario";

export function scoreRating(userRating: Rating, targetRating: Rating): number {
  const difference = Math.abs(userRating - targetRating);

  if (difference === 0) {
    return 1;
  }

  if (difference === 1) {
    return 0.5;
  }

  return 0;
}

export function scoreScenario(
  scenario: Scenario,
  ratings: Record<string, Rating>,
): ScenarioScore {
  const responses: ResponseResult[] = scenario.responses.map((response) => {
    const userRating = ratings[response.id];
    const pointsEarned = scoreRating(userRating, response.target_rating);

    return {
      responseId: response.id,
      responseText: response.response_text,
      userRating,
      targetRating: response.target_rating,
      pointsEarned,
      explanation: response.explanation,
      resultLabel:
        pointsEarned === 1
          ? "Correct"
          : pointsEarned === 0.5
            ? "Partial credit"
            : "Incorrect",
    };
  });

  const totalScore = responses.reduce(
    (total, response) => total + response.pointsEarned,
    0,
  );
  const maxScore = scenario.responses.length;

  return {
    totalScore,
    maxScore,
    percentage: Math.round((totalScore / maxScore) * 100),
    responses,
  };
}

export function adjacentRatingGuidance(targetRating: Rating): string {
  switch (targetRating) {
    case 1:
      return "A 1 usually creates new harm, avoids accountability, breaches trust, or escalates disrespectfully. A 2 may have a reasonable intention but still misses the core professional duty.";
    case 2:
      return "A 2 is flawed because it is incomplete, passive, poorly timed, or aimed at the wrong person. A 3 is appropriate and helpful, but may still lack the completeness or initiative of a 4.";
    case 3:
      return "A 3 addresses the situation in a professional way, but it may be less timely, direct, or complete than a 4. It is not wrong; it is just not the strongest response.";
    case 4:
      return "A 4 is direct, respectful, timely, honest, and accountable. It tends to preserve trust while also addressing the underlying responsibility, safety, or learning issue.";
    default:
      return "";
  }
}

export function formatRating(rating: Rating): string {
  return `${rating} - ${ratingLabels[rating]}`;
}
