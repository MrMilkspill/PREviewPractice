export interface OfficialPracticeExam {
  id: "preview-exam-1" | "preview-exam-2";
  title: string;
  description: string;
  officialUrl: string;
  scenarioCount: number;
  itemCount: number;
  durationMinutes: number;
}

export const officialPracticeExams: OfficialPracticeExam[] = [
  {
    id: "preview-exam-1",
    title: "PREview Exam 1",
    description:
      "Companion workspace for AAMC's first official free PREview practice exam.",
    officialUrl: "https://store.aamc.org/aamc-previewr-exam-practice-exam-1.html",
    scenarioCount: 30,
    itemCount: 186,
    durationMinutes: 75,
  },
  {
    id: "preview-exam-2",
    title: "PREview Exam 2",
    description:
      "Companion workspace for AAMC's second official free PREview practice exam.",
    officialUrl: "https://store.aamc.org/aamc-previewr-exam-practice-exam-2.html",
    scenarioCount: 30,
    itemCount: 186,
    durationMinutes: 75,
  },
];
