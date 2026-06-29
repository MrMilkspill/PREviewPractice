# PREview Scenario Drills

Unofficial AAMC PREview-style scenario drilling for medical school applicants.
The app lets users practice one original scenario at a time, submit ratings, see
practice scoring, review explanations, track performance locally, export history
as CSV, and generate unlimited original AI scenarios through a backend route.

## Setup

```bash
npm install
npm run dev
```

Open the local URL printed by Next.js.

## AI generation

Create `.env.local`:

```bash
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-5.5
```

`AI_API_KEY` and `AI_MODEL` are also accepted. The frontend never receives the
API key; generation runs through `src/app/api/generate-scenario/route.ts`.

The route requests strict JSON, validates the scenario, asks the model to
self-check originality and quality, and retries once if validation or the quality
check fails.

## Practice scoring

This app uses practice scoring, not official AAMC scoring:

- Exact match with target rating: 1 point
- One rating away: 0.5 points
- Two or more ratings away: 0 points

The maximum score is the number of response items in that scenario.

## Local progress

History is stored in browser `localStorage`:

- Completed scenarios
- Score and percentage
- Date completed
- Competency and difficulty
- Preloaded vs AI-generated source
- Missed responses, user rating, target rating, and points earned

The dashboard shows average score, completed count, total responses, best and
weakest competencies, recent attempts, missed-response review, source breakdown,
CSV export, and clear-history controls.

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
