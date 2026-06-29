import { NextRequest, NextResponse } from "next/server";
import {
  DifficultyLevel,
  GenerationCategory,
  generationCategories,
} from "@/types/scenario";
import { normalizeScenario, parseJsonObject } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const model = process.env.OPENAI_MODEL || process.env.AI_MODEL || "gpt-5.5";
const apiKey = process.env.OPENAI_API_KEY || process.env.AI_API_KEY;

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
      minItems: 5,
      maxItems: 7,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["response_text", "target_rating", "explanation"],
        properties: {
          response_text: { type: "string" },
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

async function callOpenAI({
  prompt,
  schema,
  name,
}: {
  prompt: string;
  schema: Record<string, unknown>;
  name: string;
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

function buildGenerationPrompt({
  category,
  difficulty,
  similarTo,
}: {
  category: GenerationCategory;
  difficulty: DifficultyLevel;
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
- Test judgment rather than medical knowledge.
- Include 5 to 7 response options.
- Include target ratings using this scale: 1 Very Ineffective, 2 Ineffective, 3 Effective, 4 Very Effective.
- Make response choices nuanced. Wrong answers should not be cartoonishly bad, and right answers should not be obvious.
- Avoid illegal medical advice, rare edge cases, overly dramatic scenarios, and scenarios where every strong action is simply "tell the supervisor."
- Explanations should be concise, specific, and should clarify why the target rating is better than adjacent ratings.
- Set source_type to "ai_generated".
- Return only valid JSON. No markdown.`;
}

function buildQualityPrompt(scenario: unknown) {
  return `Quality-check this generated PREview-style practice scenario. Return JSON with passes and issues only.

Check whether:
- It is original and not copied from AAMC.
- It tests judgment instead of medical knowledge.
- It has 5 to 7 response options.
- The target ratings are reasonably balanced and not all the same.
- Explanations are specific and useful.
- Differences between ratings are clear.
- The scenario is realistic for a premed or medical school context.
- Wrong answers are nuanced rather than cartoonishly bad.
- The strongest response is professional, timely, respectful, and accountable.

Scenario JSON:
${JSON.stringify(scenario)}`;
}

export async function POST(request: NextRequest) {
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Missing OPENAI_API_KEY or AI_API_KEY. Add one to .env.local and restart the dev server.",
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
    try {
      const generated = await callOpenAI({
        prompt: buildGenerationPrompt({
          category,
          difficulty,
          similarTo: body.similarTo,
        }),
        schema: scenarioSchema,
        name: "preview_scenario",
      });
      const normalized = normalizeScenario(generated, "ai_generated");

      if (!normalized.scenario) {
        lastError = normalized.errors.join(" ");
        continue;
      }

      const quality = (await callOpenAI({
        prompt: buildQualityPrompt(normalized.scenario),
        schema: qualityCheckSchema,
        name: "preview_scenario_quality_check",
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
