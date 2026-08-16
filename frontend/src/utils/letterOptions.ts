import type { Letter } from "../types";
import { shuffle } from "./shuffle";

export type LetterDifficulty = "easy" | "medium" | "hard";

const DISTRACTOR_COUNT: Record<LetterDifficulty, number> = {
  easy: 2,
  medium: 3,
  hard: 5,
};

/** Возвращает варианты ответа (тексты транслита), включая правильный, перемешанные. */
export function pickLetterOptions(
  letter: Letter,
  allLetters: Letter[],
  difficulty: LetterDifficulty
): string[] {
  const correctText = letter.ru_translit;

  const byText = new Map<string, Letter>();
  for (const l of allLetters) {
    if (l.ru_translit === correctText) continue;
    if (!byText.has(l.ru_translit)) byText.set(l.ru_translit, l);
  }
  const candidates = [...byText.values()];
  const sameGroup = shuffle(candidates.filter((l) => l.group === letter.group));
  const otherGroup = shuffle(candidates.filter((l) => l.group !== letter.group));

  const needed = DISTRACTOR_COUNT[difficulty];
  const preferredSameGroupCount = difficulty === "easy" ? 0 : difficulty === "medium" ? 1 : needed;

  const chosen: Letter[] = [];
  chosen.push(...sameGroup.slice(0, Math.min(preferredSameGroupCount, sameGroup.length)));

  const remainingPool = shuffle([
    ...sameGroup.slice(chosen.length),
    ...otherGroup,
  ]);
  for (const l of remainingPool) {
    if (chosen.length >= needed) break;
    chosen.push(l);
  }

  const texts = [correctText, ...chosen.map((l) => l.ru_translit)];
  return shuffle(texts);
}
