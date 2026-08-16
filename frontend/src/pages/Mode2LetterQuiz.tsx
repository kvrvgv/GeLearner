import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useData } from "../context/DataContext";
import { useShuffledQueue } from "../hooks/useShuffledQueue";
import { DifficultyPicker } from "../components/DifficultyPicker";
import { SettingsMenu } from "../components/SettingsMenu";
import { ScreenFlash } from "../components/ScreenFlash";
import { StatsBar } from "../components/StatsBar";
import { pickLetterOptions, type LetterDifficulty } from "../utils/letterOptions";
import type { Letter } from "../types";

const CORRECT_DELAY_MS = 1400;
const WRONG_DELAY_MS = 1500;

export default function Mode2LetterQuiz() {
  const { letters, loading, error } = useData();
  const [difficulty, setDifficulty] = useState<LetterDifficulty>("easy");
  const { next } = useShuffledQueue<Letter>(letters);

  const [letter, setLetter] = useState<Letter | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "correct" | "wrong">("idle");
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const timeoutRef = useRef<number | null>(null);

  function loadLetter(l: Letter | null) {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    if (!l) return;
    setLetter(l);
    setOptions(pickLetterOptions(l, letters, difficulty));
    setSelected(null);
    setStatus("idle");
  }

  useEffect(() => {
    if (letters.length > 0) loadLetter(next());
    setCorrectCount(0);
    setWrongCount(0);
    setStreak(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [letters, difficulty]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  function handlePick(text: string) {
    if (status !== "idle" || !letter) return;
    setSelected(text);
    if (text === letter.ru_translit) {
      setStatus("correct");
      setCorrectCount((c) => c + 1);
      setStreak((s) => s + 1);
      timeoutRef.current = window.setTimeout(() => loadLetter(next()), CORRECT_DELAY_MS);
    } else {
      setStatus("wrong");
      setWrongCount((c) => c + 1);
      setStreak(0);
      timeoutRef.current = window.setTimeout(() => loadLetter(next()), WRONG_DELAY_MS);
    }
  }

  if (loading) return <div className="stage-center">Загрузка...</div>;
  if (error) return <div className="stage-center">Ошибка: {error}</div>;
  if (!letter) return <div className="stage-center">Нет букв</div>;

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/" className="back-btn">← Меню</Link>
        <h1 className="mode-title">Как читается буква?</h1>
        <SettingsMenu
          tabs={[
            {
              key: "difficulty",
              label: "Сложность",
              content: (
                <DifficultyPicker
                  value={difficulty}
                  onChange={setDifficulty}
                  options={[
                    { value: "easy", label: "Уровень 1" },
                    { value: "medium", label: "Уровень 2" },
                    { value: "hard", label: "Уровень 3" },
                  ]}
                />
              ),
            },
          ]}
        />
      </header>

      <ScreenFlash
        state={status}
        durationMs={status === "correct" ? CORRECT_DELAY_MS : WRONG_DELAY_MS}
      />

      <StatsBar correct={correctCount} wrong={wrongCount} streak={streak} />

      <div className="stage">
        <div className="letter-display">{letter.char}</div>

        <div className="options-grid">
          {options.map((opt) => {
            let cls = "option-btn";
            const isCorrectOpt = opt === letter.ru_translit;
            if (status !== "idle" && isCorrectOpt) cls += " correct";
            if (selected === opt && status === "wrong") cls += " wrong";
            return (
              <button
                key={opt}
                type="button"
                className={cls}
                onClick={() => handlePick(opt)}
                disabled={status !== "idle"}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
