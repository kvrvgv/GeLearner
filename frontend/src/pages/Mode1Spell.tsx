import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useData } from "../context/DataContext";
import { useShuffledQueue } from "../hooks/useShuffledQueue";
import { tokenizeWord, requiredChunks, type WordToken } from "../utils/tokenize";
import { shuffle } from "../utils/shuffle";
import { CategoryPicker } from "../components/CategoryPicker";
import { DifficultyPicker } from "../components/DifficultyPicker";
import { FeedbackBanner, type FeedbackState } from "../components/FeedbackBanner";
import { SettingsMenu } from "../components/SettingsMenu";
import { ScreenFlash } from "../components/ScreenFlash";
import { StatsBar } from "../components/StatsBar";
import { DifficultyGate } from "../components/DifficultyGate";
import { useTheme } from "../hooks/useTheme";
import type { Word } from "../types";

type Difficulty = "no_extra" | "with_extra";

const CORRECT_DELAY_MS = 1900;
const WRONG_DELAY_MS = 1900;

interface Card {
  uid: string;
  text: string;
  used: boolean;
}

interface AnswerTile {
  uid: string;
  text: string;
}

function buildPool(chunks: string[], extraTranslits: string[], difficulty: Difficulty): Card[] {
  const cards: Card[] = chunks.map((text, i) => ({
    uid: `req-${i}-${Math.random().toString(36).slice(2)}`,
    text,
    used: false,
  }));

  if (difficulty === "with_extra" && extraTranslits.length > 0) {
    const extraCount = Math.min(6, Math.max(3, Math.round(chunks.length * 0.6)));
    const distinctExtras = extraTranslits.filter((t) => !chunks.includes(t));
    const pool = distinctExtras.length >= extraCount ? distinctExtras : extraTranslits;
    const picked = shuffle(pool).slice(0, extraCount);
    picked.forEach((text, i) => {
      cards.push({ uid: `extra-${i}-${Math.random().toString(36).slice(2)}`, text, used: false });
    });
  }

  return shuffle(cards);
}

export default function Mode1Spell() {
  const { categories, words, lettersByChar, letters, loading, error } = useData();

  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [difficulty, setDifficulty] = useState<Difficulty>("no_extra");
  const [difficultyChosen, setDifficultyChosen] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [invalidPulse, setInvalidPulse] = useState(0);
  const { theme, setTheme } = useTheme();

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
  const [tokens, setTokens] = useState<WordToken[]>([]);
  const [pool, setPool] = useState<Card[]>([]);
  const [answer, setAnswer] = useState<AnswerTile[]>([]);
  const [feedback, setFeedback] = useState<FeedbackState>("idle");
  const timeoutRef = useRef<number | null>(null);

  const allTranslits = useMemo(() => letters.map((l) => l.ru_translit), [letters]);

  function loadWord(w: Word | null) {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    if (!w) {
      setWord(null);
      return;
    }
    const toks = tokenizeWord(w.georgian_text, lettersByChar);
    const chunks = requiredChunks(toks);
    setWord(w);
    setTokens(toks);
    setPool(buildPool(chunks, allTranslits, difficulty));
    setAnswer([]);
    setFeedback("idle");
  }

  useEffect(() => {
    if (filteredWords.length > 0 && lettersByChar.size > 0) {
      loadWord(next());
    }
    setCorrectCount(0);
    setWrongCount(0);
    setStreak(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredWords, lettersByChar, difficulty]);

  function resetStats() {
    setCorrectCount(0);
    setWrongCount(0);
    setStreak(0);
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  const targetLength = requiredChunks(tokens).length;

  function reconstruct(tiles: AnswerTile[]): string {
    let i = 0;
    let out = "";
    for (const t of tokens) {
      if (t.type === "literal") {
        out += t.char;
      } else {
        out += tiles[i]?.text ?? "";
        i += 1;
      }
    }
    return out;
  }

  function handleCardTap(card: Card) {
    if (feedback !== "idle" || card.used || answer.length >= targetLength) return;
    setPool((prev) => prev.map((c) => (c.uid === card.uid ? { ...c, used: true } : c)));
    const nextAnswer = [...answer, { uid: card.uid, text: card.text }];
    setAnswer(nextAnswer);

    if (nextAnswer.length === targetLength && word) {
      const guess = reconstruct(nextAnswer);
      if (guess === word.ru_translit) {
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
  }

  function handleTileTap(index: number) {
    if (feedback !== "idle") return;
    const tile = answer[index];
    setAnswer((prev) => prev.filter((_, i) => i !== index));
    setPool((prev) => prev.map((c) => (c.uid === tile.uid ? { ...c, used: false } : c)));
  }

  const pendingKeyRef = useRef<{ char: string; timer: number } | null>(null);

  useEffect(() => {
    if (feedback !== "idle" || !word) return;

    function tryMatch(text: string) {
      const card = pool.find((c) => !c.used && c.text.toLowerCase() === text);
      if (card) {
        handleCardTap(card);
      } else {
        setInvalidPulse((n) => n + 1);
      }
    }

    function resolvePending() {
      const pending = pendingKeyRef.current;
      if (!pending) return;
      pendingKeyRef.current = null;
      tryMatch(pending.char);
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key === "Backspace") {
        e.preventDefault();
        if (pendingKeyRef.current) {
          window.clearTimeout(pendingKeyRef.current.timer);
          pendingKeyRef.current = null;
          return;
        }
        if (answer.length > 0) handleTileTap(answer.length - 1);
        return;
      }

      const key = e.key.toLowerCase();
      if (!/^[а-яё]$/.test(key)) return;
      if (answer.length >= targetLength) return;

      const pending = pendingKeyRef.current;
      if (pending) {
        window.clearTimeout(pending.timer);
        pendingKeyRef.current = null;
        const combined = pending.char + key;
        const combinedCard = pool.find((c) => !c.used && c.text.toLowerCase() === combined);
        if (combinedCard) {
          handleCardTap(combinedCard);
          return;
        }
        tryMatch(pending.char);
      }

      const couldStartDigraph = pool.some(
        (c) => !c.used && c.text.length > 1 && c.text.toLowerCase().startsWith(key)
      );

      if (couldStartDigraph) {
        pendingKeyRef.current = {
          char: key,
          timer: window.setTimeout(resolvePending, 350),
        };
      } else {
        tryMatch(key);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      if (pendingKeyRef.current) {
        window.clearTimeout(pendingKeyRef.current.timer);
        pendingKeyRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool, answer, feedback, word, targetLength]);

  if (!difficultyChosen) {
    return (
      <div className="app-shell">
        <header className="topbar">
          <Link to="/" className="back-btn">← Меню</Link>
          <h1 className="mode-title">Собери слово по буквам</h1>
        </header>
        <DifficultyGate
          options={[
            { value: "no_extra", label: "Без лишних букв", hint: "Только нужные буквы" },
            { value: "with_extra", label: "С лишними буквами", hint: "Есть отвлекающие варианты" },
          ]}
          onSelect={(v) => {
            setDifficulty(v);
            setDifficultyChosen(true);
          }}
        />
      </div>
    );
  }

  if (loading) return <div className="stage-center">Загрузка...</div>;
  if (error) return <div className="stage-center">Ошибка: {error}</div>;
  if (!word) return <div className="stage-center">Нет слов для выбранных тем</div>;

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/" className="back-btn">← Меню</Link>
        <h1 className="mode-title">Собери слово по буквам</h1>
        <SettingsMenu
          onResetStats={resetStats}
          sections={[
            {
              key: "difficulty",
              label: "Сложность",
              content: (
                <DifficultyPicker
                  value={difficulty}
                  onChange={setDifficulty}
                  options={[
                    { value: "no_extra", label: "Без лишних букв" },
                    { value: "with_extra", label: "С лишними буквами" },
                  ]}
                />
              ),
            },
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
      {invalidPulse > 0 && <ScreenFlash key={invalidPulse} state="invalid" durationMs={500} />}

      <StatsBar correct={correctCount} wrong={wrongCount} streak={streak} />

      <div className="stage">
        <div className="word-display">{word.georgian_text}</div>

        <div className={`answer-slots ${feedback}`}>
          {Array.from({ length: targetLength }).map((_, i) => {
            const tile = answer[i];
            return (
              <button
                key={i}
                type="button"
                className={`slot ${tile ? "filled" : ""}`}
                onClick={() => tile && handleTileTap(i)}
                disabled={!tile}
              >
                {tile?.text ?? ""}
              </button>
            );
          })}
        </div>

        <FeedbackBanner state={feedback} reading={word.ru_translit} translation={word.translation_ru} />

        <div
          className={`card-grid ${invalidPulse > 0 ? "invalid-shake" : ""}`}
          key={invalidPulse}
        >
          {pool.map((card) => (
            <button
              key={card.uid}
              type="button"
              className={`letter-card ${card.used ? "used" : ""}`}
              onClick={() => handleCardTap(card)}
              disabled={card.used || feedback !== "idle"}
            >
              {card.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
