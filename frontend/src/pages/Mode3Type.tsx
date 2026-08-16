import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useData } from "../context/DataContext";
import { useShuffledQueue } from "../hooks/useShuffledQueue";
import { CategoryPicker } from "../components/CategoryPicker";
import { FeedbackBanner, type FeedbackState } from "../components/FeedbackBanner";
import { SettingsMenu } from "../components/SettingsMenu";
import { ScreenFlash } from "../components/ScreenFlash";
import type { Word } from "../types";

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ").replace(/ё/g, "е");
}

export default function Mode3Type() {
  const { categories, words, loading, error } = useData();

  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (categories.length > 0 && selectedCategories.size === 0) {
      setSelectedCategories(new Set(categories.map((c) => c.slug)));
    }
  }, [categories, selectedCategories.size]);

  const filteredWords = useMemo(
    () => words.filter((w) => selectedCategories.has(w.category)),
    [words, selectedCategories]
  );

  const { next } = useShuffledQueue<Word>(filteredWords);

  const [word, setWord] = useState<Word | null>(null);
  const [value, setValue] = useState("");
  const [feedback, setFeedback] = useState<FeedbackState>("idle");
  const timeoutRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  function loadWord(w: Word | null) {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    setWord(w);
    setValue("");
    setFeedback("idle");
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  useEffect(() => {
    if (filteredWords.length > 0) loadWord(next());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredWords]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  function checkAnswer() {
    if (feedback !== "idle" || !word || value.trim() === "") return;
    if (normalize(value) === normalize(word.ru_translit)) {
      setFeedback("correct");
      timeoutRef.current = window.setTimeout(() => loadWord(next()), 1900);
    } else {
      setFeedback("wrong");
      timeoutRef.current = window.setTimeout(() => {
        setValue("");
        setFeedback("idle");
        inputRef.current?.focus();
      }, 1100);
    }
  }

  if (loading) return <div className="stage-center">Загрузка...</div>;
  if (error) return <div className="stage-center">Ошибка: {error}</div>;
  if (!word) return <div className="stage-center">Нет слов для выбранных тем</div>;

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/" className="back-btn">← Меню</Link>
        <h1 className="mode-title">Напиши слово по-русски</h1>
        <SettingsMenu
          tabs={[
            {
              key: "topics",
              label: "Темы",
              content: (
                <CategoryPicker
                  categories={categories}
                  selected={selectedCategories}
                  onChange={setSelectedCategories}
                />
              ),
            },
          ]}
        />
      </header>

      <ScreenFlash state={feedback} />

      <div className="stage">
        <div className="word-display">{word.georgian_text}</div>

        <div className={`text-input-row ${feedback}`}>
          <input
            ref={inputRef}
            className="big-input"
            type="text"
            value={value}
            disabled={feedback !== "idle"}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") checkAnswer();
            }}
            placeholder="как читается?"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
          />
          <button
            type="button"
            className="check-btn"
            onClick={checkAnswer}
            disabled={feedback !== "idle" || value.trim() === ""}
          >
            Проверить
          </button>
        </div>

        <FeedbackBanner state={feedback} translation={word.translation_ru} />
      </div>
    </div>
  );
}
