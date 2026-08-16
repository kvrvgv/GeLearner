import type { Category, Letter, Word } from "./types";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000/api";

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    throw new Error(`Ошибка запроса ${path}: ${res.status}`);
  }
  return res.json();
}

export function fetchCategories(): Promise<Category[]> {
  return getJson<Category[]>("/categories/");
}

export function fetchLetters(): Promise<Letter[]> {
  return getJson<Letter[]>("/letters/");
}

export function fetchWords(): Promise<Word[]> {
  return getJson<Word[]>("/words/");
}
