export type FeedbackState = "idle" | "correct" | "wrong";

interface Props {
  state: FeedbackState;
  translation?: string;
}

export function FeedbackBanner({ state, translation }: Props) {
  if (state === "idle") return <div className="feedback-banner idle" />;

  if (state === "correct") {
    return (
      <div className="feedback-banner correct">
        <span className="feedback-title">Верно! ✓</span>
        {translation && <span className="feedback-translation">{translation}</span>}
      </div>
    );
  }

  return (
    <div className="feedback-banner wrong">
      <span className="feedback-title">Неверно ✕</span>
    </div>
  );
}
