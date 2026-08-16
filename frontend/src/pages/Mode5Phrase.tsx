import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useData } from "../context/DataContext";
import { useShuffledQueue } from "../hooks/useShuffledQueue";
import { tokenizeWord, requiredChunks, type WordToken } from "../utils/tokenize";
import { shuffle } from "../utils/shuffle";
import { DifficultyPicker } from "../components/DifficultyPicker";
import { FeedbackBanner, type FeedbackState } from "../components/FeedbackBanner";
import { SettingsMenu } from "../components/SettingsMenu";
import { ScreenFlash } from "../components/ScreenFlash";
import { StatsBar } from "../components/StatsBar";
import { DifficultyGate } from "../components/DifficultyGate";
import { useTheme } from "../hooks/useTheme";
import { useAutoAdvance } from "../hooks/useAutoAdvance";
import type { Word } from "../types";

const PHRASE_CATEGORY = "voprosy";

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

type AnswerSlot = AnswerTile | null;

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

export default function Mode5Phrase() {
  const { words, lettersByChar, letters, loading, error } = useData();

  const [difficulty, setDifficulty] = useState<Difficulty>("no_extra");
  const [difficultyChosen, setDifficultyChosen] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [invalidPulse, setInvalidPulse] = useState(0);
  const { theme, setTheme } = useTheme();
  const { autoAdvance, setAutoAdvance } = useAutoAdvance();

  const filteredWords = useMemo(
    () => words.filter((w) => w.category === PHRASE_CATEGORY),
    [words]
  );

  const { next } = useShuffledQueue<Word>(filteredWords);

  const [word, setWord] = useState<Word | null>(null);
  const [tokens, setTokens] = useState<WordToken[]>([]);
  const [pool, setPool] = useState<Card[]>([]);
  const [answer, setAnswer] = useState<AnswerSlot[]>([]);
  const [feedback, setFeedback] = useState<FeedbackState>("idle");
  const timeoutRef = useRef<number | null>(null);

  const allTranslits = useMemo(() => letters.map((l) => l.ru_translit), [letters]);

  const poolRef = useRef<Card[]>([]);
  const answerRef = useRef<AnswerSlot[]>([]);

  function loadWord(w: Word | null) {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    if (!w) {
      setWord(null);
      return;
    }
    const toks = tokenizeWord(w.georgian_text, lettersByChar);
    const chunks = requiredChunks(toks);
    const newPool = buildPool(chunks, allTranslits, difficulty);
    const newAnswer: AnswerSlot[] = Array(chunks.length).fill(null);
    setWord(w);
    setTokens(toks);
    setPool(newPool);
    poolRef.current = newPool;
    setAnswer(newAnswer);
    answerRef.current = newAnswer;
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

  const slotGroups = useMemo(() => {
    const groups: number[][] = [[]];
    let idx = 0;
    for (const t of tokens) {
      if (t.type === "letter") {
        groups[groups.length - 1].push(idx);
        idx += 1;
      } else if (/\s/.test(t.char) && groups[groups.length - 1].length > 0) {
        groups.push([]);
      }
    }
    return groups.filter((g) => g.length > 0);
  }, [tokens]);

  function reconstruct(tiles: AnswerSlot[]): string {
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
    if (feedback !== "idle" || card.used) return;
    const currentAnswer = answerRef.current;
    const emptyIndex = currentAnswer.findIndex((t) => t === null);
    if (emptyIndex === -1) return;

    const nextPool = poolRef.current.map((c) => (c.uid === card.uid ? { ...c, used: true } : c));
    poolRef.current = nextPool;
    setPool(nextPool);

    const nextAnswer = currentAnswer.map((t, i) => (i === emptyIndex ? { uid: card.uid, text: card.text } : t));
    answerRef.current = nextAnswer;
    setAnswer(nextAnswer);

    if (nextAnswer.every((t) => t !== null) && word) {
      const guess = reconstruct(nextAnswer);
      if (guess === word.ru_translit) {
        setFeedback("correct");
        setCorrectCount((c) => c + 1);
        setStreak((s) => s + 1);
        if (autoAdvance) {
          timeoutRef.current = window.setTimeout(() => loadWord(next()), CORRECT_DELAY_MS);
        }
      } else {
        setFeedback("wrong");
        setWrongCount((c) => c + 1);
        setStreak(0);
        if (autoAdvance) {
          timeoutRef.current = window.setTimeout(() => loadWord(next()), WRONG_DELAY_MS);
        }
      }
    }
  }

  function advanceManually() {
    if (feedback === "idle") return;
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    loadWord(next());
  }

  function handleTileTap(index: number) {
    if (feedback !== "idle") return;
    const tile = answerRef.current[index];
    if (!tile) return;

    const nextAnswer = answerRef.current.map((t, i) => (i === index ? null : t));
    answerRef.current = nextAnswer;
    setAnswer(nextAnswer);

    const nextPool = poolRef.current.map((c) => (c.uid === tile.uid ? { ...c, used: false } : c));
    poolRef.current = nextPool;
    setPool(nextPool);
  }

  const pendingKeyRef = useRef<{ char: string; timer: number } | null>(null);

  useEffect(() => {
    if (feedback !== "idle" || !word) return;

    function tryMatch(text: string) {
      const card = poolRef.current.find((c) => !c.used && c.text.toLowerCase() === text);
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
        const lastFilled = answerRef.current.findLastIndex((t) => t !== null);
        if (lastFilled !== -1) handleTileTap(lastFilled);
        return;
      }

      const key = e.key.toLowerCase();
      if (!/^[а-яё]$/.test(key)) return;
      if (!answerRef.current.some((t) => t === null)) return;

      const pending = pendingKeyRef.current;
      if (pending) {
        window.clearTimeout(pending.timer);
        pendingKeyRef.current = null;
        const combined = pending.char + key;
        const combinedCard = poolRef.current.find((c) => !c.used && c.text.toLowerCase() === combined);
        if (combinedCard) {
          handleCardTap(combinedCard);
          return;
        }
        tryMatch(pending.char);
      }

      const couldStartDigraph = poolRef.current.some(
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

  useEffect(() => {
    if (autoAdvance || feedback === "idle") return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        advanceManually();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoAdvance, feedback]);

  if (!difficultyChosen) {
    return (
      <div className="app-shell">
        <header className="topbar">
          <Link to="/" className="back-btn">← Меню</Link>
          <h1 className="mode-title">Собери фразу</h1>
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
  if (!word) return <div className="stage-center">Нет фраз</div>;

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/" className="back-btn">← Меню</Link>
        <h1 className="mode-title">Собери фразу</h1>
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
              key: "advance",
              label: "Переход к следующей фразе",
              content: (
                <DifficultyPicker
                  value={autoAdvance ? "on" : "off"}
                  onChange={(v) => setAutoAdvance(v === "on")}
                  options={[
                    { value: "on", label: "Автоматически" },
                    { value: "off", label: "Вручную" },
                  ]}
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
          {slotGroups.map((group, gi) => (
            <div className="word-group" key={gi}>
              {group.map((i) => {
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
          ))}
        </div>

        <FeedbackBanner state={feedback} reading={word.ru_translit} translation={word.translation_ru} />

        {feedback !== "idle" && !autoAdvance && (
          <div className="advance-hint">
            Нажмите пробел или коснитесь экрана, чтобы перейти к следующей фразе
          </div>
        )}

        {(autoAdvance || feedback === "idle") && (
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
        )}

        {feedback !== "idle" && !autoAdvance && (
          <button
            type="button"
            className="advance-overlay"
            onClick={advanceManually}
            aria-label="Перейти к следующей фразе"
          />
        )}
      </div>
    </div>
  );
}
