import { addStress } from "../utils/stress";

export type FeedbackState = "idle" | "correct" | "wrong";

interface Props {
  state: FeedbackState;
  /** ru_translit — how the Georgian word actually reads */
  reading?: string;
  translation?: string;
}

export function FeedbackBanner({ state, reading, translation }: Props) {
  if (state === "idle") return <div className="feedback-banner idle" />;

  const isCorrect = state === "correct";

  return (
    <div className={`feedback-banner ${state}`}>
      <span className="feedback-icon" aria-label={isCorrect ? "Верно" : "Неверно"}>
        {isCorrect ? "✓" : "✕"}
      </span>
      {reading && <span className="feedback-reading">{addStress(reading)}</span>}
      {translation && <span className="feedback-translation">{translation}</span>}
    </div>
  );
}
