# PREview Scenario Drills

Unofficial PREview practice workspace for medical school applicants. The app has
two official AAMC PREview practice-exam companion sections plus an original AI
scenario drill mode.

The official companion sections do not reproduce AAMC scenarios, response
choices, rationales, or answer keys. They link to the official AAMC PDFs and
provide timing, scenario navigation, blank rating slots, local progress tracking,
optional self-check target entry, and CSV export.

## Setup

```bash
npm install
npm run dev
```

Open the local URL printed by Next.js.

## AI generation

Create `.env.local`:

```bash
AI_PROVIDER=mistral
MISTRAL_API_KEY=your_mistral_key_here
MISTRAL_MODEL=mistral-large-latest
```

OpenAI is also supported:

```bash
AI_PROVIDER=openai
OPENAI_API_KEY=your_openai_key_here
OPENAI_MODEL=gpt-5.5
```

`AI_API_KEY` and `AI_MODEL` are accepted as generic fallbacks. The frontend never
receives the API key; generation runs through
`src/app/api/generate-scenario/route.ts`.

The route requests strict JSON, validates the scenario, asks the model to
self-check originality and quality, and retries once if validation or the quality
check fails.

## Official exam companion sections

The app includes:

- `PREview Exam 1`
- `PREview Exam 2`

Each companion section provides:

- A link to the official AAMC practice exam listing
- PDF-matched scenario navigation slots: 30 for Exam 1 and 31 for Exam 2
- 186 blank response-rating slots
- Optional 75-minute timer
- Local rating persistence
- Optional target-rating entry from your own official AAMC answer key
- Practice scoring from user-entered targets only

The app intentionally leaves official content in the official PDF. The number of
blank response slots shown for each scenario is preconfigured from the
user-provided official PDFs as structural metadata only.

## Practice scoring

This app uses practice scoring, not official AAMC scoring:

- Exact match with target rating: 1 point
- One rating away: 0.5 points
- Two or more ratings away: 0 points

The maximum score is the number of response items in that scenario.

## Local progress

History is stored in browser `localStorage`:

- Official companion exam progress
- User ratings for official companion response slots
- Optional user-entered target ratings from official AAMC answer keys
- AI-generated drill attempts
- Practice scores, dates, competencies, and CSV export rows

The dashboard shows official companion progress, optional self-check progress,
AI drill history, CSV export, and clear-history controls.

## Reference materials

Before building the app, the official AAMC PREview preparation page and the free
practice-exam PDFs linked from AAMC were reviewed as structural reference only:

- [AAMC PREview preparation page](https://students-residents.aamc.org/aamc-preview/prepare-aamc-preview-exam)
- [AAMC PREview practice exam 1 listing](https://store.aamc.org/aamc-previewr-exam-practice-exam-1.html)
- [AAMC PREview practice exam 2 listing](https://store.aamc.org/aamc-previewr-exam-practice-exam-2.html)

If you want to do additional private calibration review, place official free
AAMC PREview PDFs in `/reference-materials`. Do not include official AAMC PDF
content in the app. Use it only as private reference material during development
to understand format, reasoning style, and difficulty.

## Disclaimer

This is an unofficial PREview practice tool. It does not contain official AAMC
questions and is not affiliated with or endorsed by AAMC. Use official AAMC
materials for the most accurate preparation.
