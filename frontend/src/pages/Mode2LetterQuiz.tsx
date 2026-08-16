import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useData } from "../context/DataContext";
import { useShuffledQueue } from "../hooks/useShuffledQueue";
import { DifficultyPicker } from "../components/DifficultyPicker";
import { pickLetterOptions, type LetterDifficulty } from "../utils/letterOptions";
import type { Letter } from "../types";

export default function Mode2LetterQuiz() {
  const { letters, loading, error } = useData();
  const [difficulty, setDifficulty] = useState<LetterDifficulty>("easy");
  const { next } = useShuffledQueue<Letter>(letters);

  const [letter, setLetter] = useState<Letter | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "correct" | "wrong">("idle");
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
      timeoutRef.current = window.setTimeout(() => loadLetter(next()), 1200);
    } else {
      setStatus("wrong");
      timeoutRef.current = window.setTimeout(() => {
        setStatus("idle");
        setSelected(null);
      }, 900);
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
      </header>

      <div className="settings-panel">
        <DifficultyPicker
          value={difficulty}
          onChange={setDifficulty}
          options={[
            { value: "easy", label: "Уровень 1" },
            { value: "medium", label: "Уровень 2" },
            { value: "hard", label: "Уровень 3" },
          ]}
        />
      </div>

      <div className="stage">
        <div className="letter-display">{letter.char}</div>

        <div className="options-grid">
          {options.map((opt) => {
            let cls = "option-btn";
            if (selected === opt && status === "correct") cls += " correct";
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
