interface Option<T extends string> {
  value: T;
  label: string;
  hint?: string;
}

interface Props<T extends string> {
  options: Option<T>[];
  onSelect: (value: T) => void;
}

export function DifficultyGate<T extends string>({ options, onSelect }: Props<T>) {
  return (
    <div className="difficulty-gate">
      <p className="difficulty-gate-hint">Выбери сложность</p>
      <div className="difficulty-gate-options">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className="difficulty-gate-option"
            onClick={() => onSelect(opt.value)}
          >
            <span className="difficulty-gate-option-title">{opt.label}</span>
            {opt.hint && <span className="difficulty-gate-option-hint">{opt.hint}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
