import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { fetchCategories, fetchLetters, fetchWords } from "../api";
import type { Category, Letter, Word } from "../types";

interface DataContextValue {
  categories: Category[];
  letters: Letter[];
  words: Word[];
  lettersByChar: Map<string, Letter>;
  loading: boolean;
  error: string | null;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [letters, setLetters] = useState<Letter[]>([]);
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchCategories(), fetchLetters(), fetchWords()])
      .then(([c, l, w]) => {
        setCategories(c);
        setLetters(l);
        setWords(w);
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, []);

  const lettersByChar = useMemo(() => {
    const map = new Map<string, Letter>();
    for (const l of letters) map.set(l.char, l);
    return map;
  }, [letters]);

  const value: DataContextValue = {
    categories,
    letters,
    words,
    lettersByChar,
    loading,
    error,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData должен вызываться внутри DataProvider");
  return ctx;
}
