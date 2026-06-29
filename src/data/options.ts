import { DifficultyLevel } from "@/types/scenario";

export const difficultyOptions: Array<{
  value: DifficultyLevel;
  label: string;
}> = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
  { value: "aamc_like_mixed", label: "AAMC-like mixed nuance" },
];
