const VOWELS = "аеёиоуыэюя";
const COMBINING_ACUTE = "́";

/**
 * Marks the stressed vowel in a Russian transliteration of a Georgian word.
 * Georgian stress isn't phonemic, but the rule of thumb taught to learners
 * (and matching conventional Russian renderings like "Тбили́си", "Бату́ми",
 * "гамарджо́ба") is: 1 syllable — no mark, 2+ syllables — the penultimate one.
 */
export function addStress(text: string): string {
  const vowelIndexes: number[] = [];
  for (let i = 0; i < text.length; i++) {
    if (VOWELS.includes(text[i].toLowerCase())) vowelIndexes.push(i);
  }
  if (vowelIndexes.length < 2) return text;

  const stressAt = vowelIndexes[vowelIndexes.length - 2];

  return text.slice(0, stressAt + 1) + COMBINING_ACUTE + text.slice(stressAt + 1);
}
