export interface Category {
  id: number;
  name: string;
  slug: string;
  order: number;
}

export interface Letter {
  id: number;
  char: string;
  ru_translit: string;
  name: string;
  group: string;
  order: number;
}

export interface Word {
  id: number;
  georgian_text: string;
  ru_translit: string;
  translation_ru: string;
  category: string;
}

export type Difficulty = "easy" | "medium" | "hard";
