const VOWELS = "аеёиоуыэюя";
const COMBINING_ACUTE = "́";

/**
 * Marks the stressed vowel in a Russian transliteration of a Georgian word.
 * Georgian stress isn't phonemic, but the rule of thumb taught to learners
 * is: 1 syllable — no mark, 2 syllables — first syllable, 3+ syllables —
 * third syllable from the end (antepenult).
 */
export function addStress(text: string): string {
  const vowelIndexes: number[] = [];
  for (let i = 0; i < text.length; i++) {
    if (VOWELS.includes(text[i].toLowerCase())) vowelIndexes.push(i);
  }
  if (vowelIndexes.length < 2) return text;

  const stressAt =
    vowelIndexes.length === 2 ? vowelIndexes[0] : vowelIndexes[vowelIndexes.length - 3];

  return text.slice(0, stressAt + 1) + COMBINING_ACUTE + text.slice(stressAt + 1);
}
