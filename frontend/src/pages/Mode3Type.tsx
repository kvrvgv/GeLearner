import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useData } from "../context/DataContext";
import { useShuffledQueue } from "../hooks/useShuffledQueue";
import { CategoryPicker } from "../components/CategoryPicker";
import { DifficultyPicker } from "../components/DifficultyPicker";
import { FeedbackBanner, type FeedbackState } from "../components/FeedbackBanner";
import { SettingsMenu } from "../components/SettingsMenu";
import { ScreenFlash } from "../components/ScreenFlash";
import { StatsBar } from "../components/StatsBar";
import { useTheme } from "../hooks/useTheme";
import type { Word } from "../types";

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ").replace(/ё/g, "е");
}

const CORRECT_DELAY_MS = 1900;
const WRONG_DELAY_MS = 1900;

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
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const { theme, setTheme } = useTheme();
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
    setCorrectCount(0);
    setWrongCount(0);
    setStreak(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredWords]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  function resetStats() {
    setCorrectCount(0);
    setWrongCount(0);
    setStreak(0);
  }

  function checkAnswer() {
    if (feedback !== "idle" || !word || value.trim() === "") return;
    if (normalize(value) === normalize(word.ru_translit)) {
      setFeedback("correct");
      setCorrectCount((c) => c + 1);
      setStreak((s) => s + 1);
      timeoutRef.current = window.setTimeout(() => loadWord(next()), CORRECT_DELAY_MS);
    } else {
      setFeedback("wrong");
      setWrongCount((c) => c + 1);
      setStreak(0);
      timeoutRef.current = window.setTimeout(() => loadWord(next()), WRONG_DELAY_MS);
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
          onResetStats={resetStats}
          sections={[
            {
              key: "topics",
              label: "Темы",
              collapsible: true,
              badge: `${selectedCategories.size}/${categories.length}`,
              content: (
                <CategoryPicker
                  categories={categories}
                  selected={selectedCategories}
                  onChange={setSelectedCategories}
                />
              ),
            },
            {
              key: "theme",
              label: "Оформление",
              content: (
                <DifficultyPicker
                  value={theme}
                  onChange={setTheme}
                  options={[
                    { value: "light", label: "Светлая" },
                    { value: "dark", label: "Тёмная" },
                    { value: "auto", label: "Авто" },
                  ]}
                />
              ),
            },
          ]}
        />
      </header>

      <ScreenFlash
        state={feedback}
        durationMs={feedback === "correct" ? CORRECT_DELAY_MS : WRONG_DELAY_MS}
      />

      <StatsBar correct={correctCount} wrong={wrongCount} streak={streak} />

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

        <FeedbackBanner state={feedback} reading={word.ru_translit} translation={word.translation_ru} />
      </div>
    </div>
  );
}
