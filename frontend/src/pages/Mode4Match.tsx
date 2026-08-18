import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useData } from "../context/DataContext";
import { useShuffledQueue } from "../hooks/useShuffledQueue";
import { shuffle } from "../utils/shuffle";
import { CategoryPicker } from "../components/CategoryPicker";
import { DifficultyPicker } from "../components/DifficultyPicker";
import { DifficultyGate } from "../components/DifficultyGate";
import { SettingsMenu } from "../components/SettingsMenu";
import { StatsBar } from "../components/StatsBar";
import { useTheme } from "../hooks/useTheme";
import type { Word, WordLevelFilter } from "../types";

type Difficulty = "no_extra" | "with_extra";

const ROUND_SIZE = 6;
const NEXT_ROUND_DELAY_MS = 600;
const WRONG_RESET_MS = 550;

interface Tile {
  uid: string;
  wordId: number;
  text: string;
  matched: boolean;
}

export default function Mode4Match() {
  const { categories, words, loading, error } = useData();

  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [wordLevel, setWordLevel] = useState<WordLevelFilter>("all");
  const [difficulty, setDifficulty] = useState<Difficulty>("no_extra");
  const [difficultyChosen, setDifficultyChosen] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (categories.length > 0 && selectedCategories.size === 0) {
      setSelectedCategories(new Set(categories.map((c) => c.slug)));
    }
  }, [categories, selectedCategories.size]);

  const filteredWords = useMemo(
    () =>
      words.filter(
        (w) => selectedCategories.has(w.category) && (wordLevel === "all" || w.level === wordLevel)
      ),
    [words, selectedCategories, wordLevel]
  );

  const { next } = useShuffledQueue<Word>(filteredWords, "mode4-words");

  const [leftTiles, setLeftTiles] = useState<Tile[]>([]);
  const [rightTiles, setRightTiles] = useState<Tile[]>([]);
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | null>(null);
  const [wrongPair, setWrongPair] = useState<{ left: string; right: string } | null>(null);
  const timeoutRef = useRef<number | null>(null);

  function resetStats() {
    setCorrectCount(0);
    setWrongCount(0);
    setStreak(0);
  }

  function loadRound() {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);

    const size = Math.min(ROUND_SIZE, filteredWords.length);
    if (size === 0) {
      setLeftTiles([]);
      setRightTiles([]);
      return;
    }

    const picked: Word[] = [];
    const seen = new Set<number>();
    let guard = 0;
    while (picked.length < size && guard < size * 20) {
      guard += 1;
      const w = next();
      if (!w || seen.has(w.id)) continue;
      seen.add(w.id);
      picked.push(w);
    }

    const left: Tile[] = shuffle(
      picked.map((w) => ({
        uid: `l-${w.id}-${Math.random().toString(36).slice(2)}`,
        wordId: w.id,
        text: w.georgian_text,
        matched: false,
      }))
    );

    let rightWords = picked;
    if (difficulty === "with_extra") {
      const extraCount = Math.min(3, Math.max(0, filteredWords.length - picked.length));
      const decoys = shuffle(filteredWords.filter((w) => !seen.has(w.id))).slice(0, extraCount);
      rightWords = [...picked, ...decoys];
    }

    const right: Tile[] = shuffle(
      rightWords.map((w) => ({
        uid: `r-${w.id}-${Math.random().toString(36).slice(2)}`,
        wordId: w.id,
        text: w.translation_ru,
        matched: false,
      }))
    );

    setLeftTiles(left);
    setRightTiles(right);
    setSelectedLeft(null);
    setSelectedRight(null);
    setWrongPair(null);
  }

  useEffect(() => {
    if (filteredWords.length > 0) loadRound();
    setCorrectCount(0);
    setWrongCount(0);
    setStreak(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredWords, difficulty]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  function evaluate(leftUid: string, rightUid: string) {
    const l = leftTiles.find((t) => t.uid === leftUid);
    const r = rightTiles.find((t) => t.uid === rightUid);
    if (!l || !r) return;

    if (l.wordId === r.wordId) {
      setCorrectCount((c) => c + 1);
      setStreak((s) => s + 1);
      setLeftTiles((prev) => prev.map((t) => (t.uid === leftUid ? { ...t, matched: true } : t)));
      setRightTiles((prev) => prev.map((t) => (t.uid === rightUid ? { ...t, matched: true } : t)));
      setSelectedLeft(null);
      setSelectedRight(null);

      const remainingAfter = leftTiles.filter((t) => !t.matched && t.uid !== leftUid).length;
      if (remainingAfter === 0) {
        timeoutRef.current = window.setTimeout(loadRound, NEXT_ROUND_DELAY_MS);
      }
    } else {
      setWrongCount((c) => c + 1);
      setStreak(0);
      setWrongPair({ left: leftUid, right: rightUid });
      timeoutRef.current = window.setTimeout(() => {
        setWrongPair(null);
        setSelectedLeft(null);
        setSelectedRight(null);
      }, WRONG_RESET_MS);
    }
  }

  function tapLeft(uid: string) {
    const tile = leftTiles.find((t) => t.uid === uid);
    if (!tile || tile.matched || wrongPair) return;
    setSelectedLeft(uid);
    if (selectedRight) evaluate(uid, selectedRight);
  }

  function tapRight(uid: string) {
    const tile = rightTiles.find((t) => t.uid === uid);
    if (!tile || tile.matched || wrongPair) return;
    setSelectedRight(uid);
    if (selectedLeft) evaluate(selectedLeft, uid);
  }

  function tileClass(side: "left" | "right", t: Tile) {
    let cls = `match-tile match-tile-${side === "left" ? "ka" : "ru"}`;
    if (t.matched) cls += " matched";
    else if (wrongPair && (side === "left" ? wrongPair.left : wrongPair.right) === t.uid)
      cls += " wrong";
    else if ((side === "left" ? selectedLeft : selectedRight) === t.uid) cls += " selected";
    return cls;
  }

  if (!difficultyChosen) {
    return (
      <div className="app-shell">
        <header className="topbar">
          <Link to="/" className="back-btn">← Меню</Link>
          <h1 className="mode-title">Сопоставь слово</h1>
        </header>
        <DifficultyGate
          options={[
            { value: "no_extra", label: "Без лишних переводов", hint: "Только нужные пары" },
            { value: "with_extra", label: "С лишними переводами", hint: "Есть отвлекающие варианты" },
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
  if (filteredWords.length === 0) {
    return <div className="stage-center">Нет слов для выбранных тем</div>;
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/" className="back-btn">← Меню</Link>
        <h1 className="mode-title">Сопоставь слово</h1>
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
                    { value: "no_extra", label: "Без лишних переводов" },
                    { value: "with_extra", label: "С лишними переводами" },
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
              key: "level",
              label: "Уровень слов",
              content: (
                <DifficultyPicker
                  value={wordLevel}
                  onChange={setWordLevel}
                  options={[
                    { value: "all", label: "Все" },
                    { value: "basic", label: "Базовые" },
                    { value: "advanced", label: "Сложные" },
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

      <StatsBar correct={correctCount} wrong={wrongCount} streak={streak} />

      <div className="stage">
        <div className="match-board">
          <div className="match-column">
            {leftTiles.map((t) => (
              <button
                key={t.uid}
                type="button"
                className={tileClass("left", t)}
                onClick={() => tapLeft(t.uid)}
                disabled={t.matched || !!wrongPair}
              >
                {t.text}
              </button>
            ))}
          </div>
          <div className="match-column">
            {rightTiles.map((t) => (
              <button
                key={t.uid}
                type="button"
                className={tileClass("right", t)}
                onClick={() => tapRight(t.uid)}
                disabled={t.matched || !!wrongPair}
              >
                {t.text}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
