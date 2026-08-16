interface Props {
  correct: number;
  wrong: number;
  streak: number;
}

export function StatsBar({ correct, wrong, streak }: Props) {
  const total = correct + wrong;
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;

  return (
    <div className="stats-bar">
      <span className="stat stat-streak" title="Стрик">
        🔥 <b>{streak}</b>
      </span>
      <span className="stat stat-correct" title="Правильно">
        ✓ <b>{correct}</b>
      </span>
      <span className="stat stat-wrong" title="Ошибок">
        ✕ <b>{wrong}</b>
      </span>
      <span className="stat stat-pct" title="Точность">
        <b>{pct}%</b>
      </span>
    </div>
  );
}
