import { NextRequest, NextResponse } from "next/server";
import {
  DifficultyLevel,
  GenerationCategory,
  Rating,
  generationCategories,
} from "@/types/scenario";
import { officialPracticeExams } from "@/data/officialPracticeExams";
import { normalizeScenario, parseJsonObject } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AiProvider = "openai" | "mistral";

function getAiConfig() {
  const provider = (
    process.env.AI_PROVIDER ||
    (process.env.MISTRAL_API_KEY ? "mistral" : "openai")
  ).toLowerCase() as AiProvider;

  if (provider === "mistral") {
    return {
      provider,
      apiKey: process.env.MISTRAL_API_KEY || process.env.AI_API_KEY,
      model:
        process.env.MISTRAL_MODEL || process.env.AI_MODEL || "mistral-large-latest",
    };
  }

  return {
    provider: "openai" as const,
    apiKey: process.env.OPENAI_API_KEY || process.env.AI_API_KEY,
    model: process.env.OPENAI_MODEL || process.env.AI_MODEL || "gpt-5.5",
  };
}

const scenarioSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "id",
    "title",
    "scenario_text",
    "competency_tested",
    "difficulty_level",
    "source_type",
    "responses",
    "overall_takeaway",
  ],
  properties: {
    id: { type: "string" },
    title: { type: "string" },
    scenario_text: { type: "string" },
    competency_tested: { type: "string" },
    difficulty_level: {
      type: "string",
      enum: ["easy", "medium", "hard", "aamc_like_mixed"],
    },
    source_type: { type: "string", enum: ["ai_generated"] },
    responses: {
      type: "array",
      minItems: 4,
      maxItems: 8,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["response_text", "target_rating", "explanation"],
        properties: {
          response_text: { type: "string", maxLength: 150 },
          target_rating: { type: "integer", enum: [1, 2, 3, 4] },
          explanation: { type: "string" },
        },
      },
    },
    overall_takeaway: { type: "string" },
  },
};

const qualityCheckSchema = {
  type: "object",
  additionalProperties: false,
  required: ["passes", "issues"],
  properties: {
    passes: { type: "boolean" },
    issues: {
      type: "array",
      items: { type: "string" },
    },
  },
};

function isDifficulty(value: unknown): value is DifficultyLevel {
  return (
    value === "easy" ||
    value === "medium" ||
    value === "hard" ||
    value === "aamc_like_mixed"
  );
}

function isCategory(value: unknown): value is GenerationCategory {
  return generationCategories.includes(value as GenerationCategory);
}

function pickOfficialLikeResponseCount() {
  const counts = officialPracticeExams.flatMap((exam) => exam.itemCounts);
  return counts[Math.floor(Math.random() * counts.length)] ?? 6;
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

function shuffledRatings(ratings: Rating[]) {
  const nextRatings = [...ratings];

  for (let index = nextRatings.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [nextRatings[index], nextRatings[swapIndex]] = [
      nextRatings[swapIndex],
      nextRatings[index],
    ];
  }

  return nextRatings;
}

function pickOfficialLikeRatingPattern(responseCount: number) {
  const patterns: Record<number, Rating[][]> = {
    4: [
      [1, 2, 3, 4],
      [1, 2, 4, 4],
      [1, 1, 3, 4],
    ],
    5: [
      [1, 1, 2, 3, 4],
      [1, 2, 2, 3, 4],
      [1, 2, 3, 4, 4],
    ],
    6: [
      [1, 1, 2, 2, 3, 4],
      [1, 2, 2, 3, 4, 4],
      [1, 1, 2, 3, 3, 4],
    ],
    7: [
      [1, 1, 2, 2, 3, 4, 4],
      [1, 1, 2, 3, 3, 4, 4],
      [1, 2, 2, 2, 3, 4, 4],
    ],
    8: [
      [1, 1, 2, 2, 3, 3, 4, 4],
      [1, 1, 1, 2, 3, 3, 4, 4],
      [1, 1, 2, 2, 2, 3, 4, 4],
    ],
  };
  const options = patterns[responseCount] ?? patterns[6];
  const pattern = options[Math.floor(Math.random() * options.length)] ?? [
    1, 1, 2, 3, 3, 4,
  ];

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const shuffledPattern = shuffledRatings(pattern);

    if (!isMonotonicRatingPattern(shuffledPattern)) {
      return shuffledPattern;
    }
  }

  return shuffledRatings(pattern);
}

function ratingPatternMatches(actual: Rating[], expected: Rating[]) {
  return (
    actual.length === expected.length &&
    actual.every((rating, index) => rating === expected[index])
  );
}

function outputTextFromResponse(payload: unknown): string {
  const response = payload as {
    output_text?: string;
    output?: Array<{
      content?: Array<{
        text?: string;
        type?: string;
      }>;
    }>;
  };

  if (response.output_text) {
    return response.output_text;
  }

  return (
    response.output
      ?.flatMap((item) => item.content ?? [])
      .map((content) => content.text ?? "")
      .join("")
      .trim() ?? ""
  );
}

function outputTextFromMistralResponse(payload: unknown): string {
  const response = payload as {
    choices?: Array<{
      message?: {
        content?: string | Array<{ text?: string; type?: string }>;
      };
    }>;
  };
  const content = response.choices?.[0]?.message?.content;

  if (typeof content === "string") {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => item.text ?? "")
      .join("")
      .trim();
  }

  return "";
}

async function callOpenAI({
  prompt,
  schema,
  name,
  apiKey,
  model,
}: {
  prompt: string;
  schema: Record<string, unknown>;
  name: string;
  apiKey: string;
  model: string;
}) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: prompt,
      text: {
        format: {
          type: "json_schema",
          name,
          strict: true,
          schema,
        },
      },
    }),
  });

  const payload = (await response.json()) as unknown;

  if (!response.ok) {
    const errorPayload = payload as { error?: { message?: string } };
    throw new Error(
      errorPayload.error?.message || "The AI service returned an error.",
    );
  }

  const text = outputTextFromResponse(payload);

  if (!text) {
    throw new Error("The AI service returned an empty response.");
  }

  return parseJsonObject(text);
}

async function callMistral({
  prompt,
  schema,
  name,
  apiKey,
  model,
}: {
  prompt: string;
  schema: Record<string, unknown>;
  name: string;
  apiKey: string;
  model: string;
}) {
  const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content:
            "Return only valid JSON. The JSON must follow the provided schema exactly.",
        },
        {
          role: "user",
          content: `${prompt}\n\nJSON schema:\n${JSON.stringify(schema)}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name,
          schema,
          strict: true,
        },
      },
      temperature: name.includes("quality") ? 0 : 0.45,
      max_tokens: name.includes("quality") ? 800 : 2600,
    }),
  });

  const payload = (await response.json()) as unknown;

  if (!response.ok) {
    const errorPayload = payload as {
      message?: string;
      detail?: string;
      error?: { message?: string };
    };
    throw new Error(
      errorPayload.error?.message ||
        errorPayload.message ||
        errorPayload.detail ||
        "The AI service returned an error.",
    );
  }

  const text = outputTextFromMistralResponse(payload);

  if (!text) {
    throw new Error("The AI service returned an empty response.");
  }

  return parseJsonObject(text);
}

async function callAi({
  prompt,
  schema,
  name,
  provider,
  apiKey,
  model,
}: {
  prompt: string;
  schema: Record<string, unknown>;
  name: string;
  provider: AiProvider;
  apiKey: string;
  model: string;
}) {
  if (provider === "mistral") {
    return callMistral({ prompt, schema, name, apiKey, model });
  }

  return callOpenAI({ prompt, schema, name, apiKey, model });
}

function buildGenerationPrompt({
  category,
  difficulty,
  responseCount,
  targetRatingPattern,
  similarTo,
}: {
  category: GenerationCategory;
  difficulty: DifficultyLevel;
  responseCount: number;
  targetRatingPattern: Rating[];
  similarTo?: {
    title?: string;
    competency_tested?: string;
    difficulty_level?: DifficultyLevel;
  };
}) {
  const categoryInstruction =
    category === "Random mixed"
      ? "Choose a balanced PREview-style competency from the allowed list."
      : `Focus the scenario on this category: ${category}.`;
  const similarInstruction = similarTo
    ? `Generate a similar-but-distinct scenario that practices the same general skill as "${similarTo.title}" (${similarTo.competency_tested}). Do not reuse the same setting, conflict, wording, response logic, or answer pattern.`
    : "Avoid repeating the same scenario structure too often.";

  return `You are generating original AAMC PREview-style practice scenarios. Do not copy, reuse, or closely paraphrase official AAMC content. You have analyzed the structure, difficulty, scoring logic, and rationale style of the official free AAMC PREview practice exams only as private reference for structure and calibration.

Generate one new original PREview-style practice scenario that follows those broad patterns without copying any official scenario, response choice, explanation, or key.

Requirements:
- ${categoryInstruction}
- Difficulty should be ${difficulty}.
- ${similarInstruction}
- Use realistic situations involving students, patients, peers, supervisors, professors, volunteers, clinical teams, academic responsibilities, professionalism, communication, service, honesty, confidentiality, feedback, teamwork, cultural sensitivity, reliability, accountability, or conflict resolution.
- Keep the scenario ordinary and plausible. The official style is usually a realistic school, clinic, lab, service, or peer-professionalism dilemma, not an emergency or rare edge case.
- Test judgment rather than medical knowledge.
- Include exactly ${responseCount} response options.
- Response options must match the concise official exam style: short imperative action statements, usually 6 to 18 words, with a hard maximum of 24 words and 150 characters.
- Each response option should be one direct action or decision. Do not include rationales, internal thoughts, multiple clauses, or extra background in the response_text.
- Use plain wording like "Ask...", "Tell...", "Remind...", "Continue...", "Report...", "Apologize...", or "Decline..." when natural. Avoid verbose coaching language.
- Include target ratings using this scale: 1 Very Ineffective, 2 Ineffective, 3 Effective, 4 Very Effective.
- Use this exact target_rating pattern in order for responses 1 through ${responseCount}: ${targetRatingPattern.join(", ")}.
- Write each response option so its quality genuinely fits its assigned target_rating. Do not merely label a response with the requested rating if the action does not match that level.
- Calibrate the target ratings like the official answer keys:
  - Very effective responses address the central issue directly, respectfully, and promptly while preserving responsibilities, honesty, confidentiality, patient welfare, or teamwork.
  - Effective responses are appropriate but incomplete, less immediate, less personally accountable, or miss one important stakeholder.
  - Ineffective responses may be supportive or well-intended, but avoid the core issue, shift responsibility, make assumptions, delay necessary action, or only address part of the problem.
  - Very ineffective responses violate obligations, ignore harm, act dishonestly, retaliate, stereotype, escalate inappropriately, or abandon a required responsibility.
- The rating pattern must be balanced: include at least one 1 and one 4, use at least three distinct ratings, and do not order responses from worst to best or best to worst.
- Build a realistic mix: one or two strong actions, one or two tempting-but-incomplete actions, and one or two clearly flawed actions. Do not make the longest response the best response.
- Make response choices nuanced. Weak answers should still sound plausible at first glance, and strong answers should not be obvious just because they mention a supervisor.
- Avoid illegal medical advice, rare edge cases, overly dramatic scenarios, and scenarios where every strong action is simply "tell the supervisor."
- Explanations should mirror official rationale logic in original wording: concise, specific, and comparative. Explain what the response addresses, what it misses, and why the target rating is better than adjacent ratings.
- Set source_type to "ai_generated".
- Return only valid JSON. No markdown.`;
}

function buildQualityPrompt(scenario: unknown) {
  return `Quality-check this generated PREview-style practice scenario. Return JSON with passes and issues only.

Check whether:
- It is original and not copied from AAMC.
- It tests judgment instead of medical knowledge.
- It has 4 to 8 response options.
- Each response option is concise official-exam style: one direct action, usually 6 to 18 words, never more than 24 words or 150 characters.
- Response options do not explain their own rationale or bundle multiple actions into a long sentence.
- The target ratings include at least one 1 and one 4, use at least three distinct ratings, and are not sorted from weakest to strongest or strongest to weakest.
- Explanations are specific and useful.
- Differences between ratings are clear.
- The scenario is realistic for a premed or medical school context.
- Weak answers are plausible but flawed rather than cartoonishly bad.
- Effective-but-not-best answers are useful but incomplete.
- The strongest responses are professional, timely, respectful, and accountable.

Scenario JSON:
${JSON.stringify(scenario)}`;
}

export async function POST(request: NextRequest) {
  const { provider, apiKey, model } = getAiConfig();

  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          provider === "mistral"
            ? "Missing MISTRAL_API_KEY or AI_API_KEY. Add one to .env.local and restart the dev server."
            : "Missing OPENAI_API_KEY or AI_API_KEY. Add one to .env.local and restart the dev server.",
      },
      { status: 400 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    category?: unknown;
    difficulty?: unknown;
    similarTo?: {
      title?: string;
      competency_tested?: string;
      difficulty_level?: DifficultyLevel;
    };
  };
  const category = isCategory(body.category) ? body.category : "Random mixed";
  const difficulty = isDifficulty(body.difficulty)
    ? body.difficulty
    : "aamc_like_mixed";

  let lastError = "The generated scenario did not pass validation.";

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const responseCount = pickOfficialLikeResponseCount();
    const targetRatingPattern = pickOfficialLikeRatingPattern(responseCount);

    try {
      const generated = await callAi({
        prompt: buildGenerationPrompt({
          category,
          difficulty,
          responseCount,
          targetRatingPattern,
          similarTo: body.similarTo,
        }),
        schema: scenarioSchema,
        name: "preview_scenario",
        provider,
        apiKey,
        model,
      });
      const normalized = normalizeScenario(generated, "ai_generated");

      if (!normalized.scenario) {
        lastError = normalized.errors.join(" ");
        continue;
      }

      const actualRatingPattern = normalized.scenario.responses.map(
        (response) => response.target_rating,
      );

      if (!ratingPatternMatches(actualRatingPattern, targetRatingPattern)) {
        lastError = "The generated target ratings did not follow the requested calibrated pattern.";
        continue;
      }

      const quality = (await callAi({
        prompt: buildQualityPrompt(normalized.scenario),
        schema: qualityCheckSchema,
        name: "preview_scenario_quality_check",
        provider,
        apiKey,
        model,
      })) as { passes?: boolean; issues?: string[] };

      if (!quality.passes) {
        lastError =
          quality.issues?.join(" ") ||
          "The generated scenario did not pass the quality check.";
        continue;
      }

      return NextResponse.json({ scenario: normalized.scenario });
    } catch (error) {
      lastError =
        error instanceof Error
          ? error.message
          : "The generated scenario could not be parsed.";
    }
  }

  return NextResponse.json(
    {
      error: `Could not generate a valid scenario after retrying. ${lastError}`,
    },
    { status: 502 },
  );
}
