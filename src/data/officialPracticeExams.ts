export interface OfficialPracticeExam {
  id: "preview-exam-1" | "preview-exam-2";
  title: string;
  description: string;
  officialUrl: string;
  scenarioCount: number;
  itemCount: number;
  itemCounts: number[];
  durationMinutes: number;
}

// Structural counts only, derived from the user-provided official PDFs. No AAMC
// scenario text, response wording, answer keys, or rationales are stored here.
const previewExam1ItemCounts = [
  5, 8, 8, 8, 5, 7, 6, 8, 5, 7, 6, 5, 5, 6, 5, 5, 6, 4, 7, 8, 5, 7, 5, 6, 7,
  7, 6, 5, 6, 8,
];

const previewExam2ItemCounts = [
  6, 5, 8, 4, 7, 5, 8, 4, 6, 7, 5, 6, 8, 4, 7, 7, 5, 7, 6, 6, 8, 6, 7, 4, 8,
  6, 5, 6, 6, 5, 4,
];

export const officialPracticeExams: OfficialPracticeExam[] = [
  {
    id: "preview-exam-1",
    title: "PREview Exam 1",
    description:
      "Companion workspace for AAMC's first official free PREview practice exam.",
    officialUrl: "https://store.aamc.org/aamc-previewr-exam-practice-exam-1.html",
    scenarioCount: previewExam1ItemCounts.length,
    itemCount: previewExam1ItemCounts.reduce((total, count) => total + count, 0),
    itemCounts: previewExam1ItemCounts,
    durationMinutes: 75,
  },
  {
    id: "preview-exam-2",
    title: "PREview Exam 2",
    description:
      "Companion workspace for AAMC's second official free PREview practice exam.",
    officialUrl: "https://store.aamc.org/aamc-previewr-exam-practice-exam-2.html",
    scenarioCount: previewExam2ItemCounts.length,
    itemCount: previewExam2ItemCounts.reduce((total, count) => total + count, 0),
    itemCounts: previewExam2ItemCounts,
    durationMinutes: 75,
  },
];
