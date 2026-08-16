import type { Letter } from "../types";

export interface LetterToken {
  type: "letter";
  char: string;
  translit: string;
}

export interface LiteralToken {
  type: "literal";
  char: string;
}

export type WordToken = LetterToken | LiteralToken;

/** Разбивает грузинское слово на буквы (с транслитерацией) и "прочие" символы (пробел и т.п.) */
export function tokenizeWord(
  georgianText: string,
  lettersByChar: Map<string, Letter>
): WordToken[] {
  const tokens: WordToken[] = [];
  for (const char of georgianText) {
    const letter = lettersByChar.get(char);
    if (letter) {
      tokens.push({ type: "letter", char, translit: letter.ru_translit });
    } else {
      tokens.push({ type: "literal", char });
    }
  }
  return tokens;
}

export function requiredChunks(tokens: WordToken[]): string[] {
  return tokens.filter((t): t is LetterToken => t.type === "letter").map((t) => t.translit);
}
