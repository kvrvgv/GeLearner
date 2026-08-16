interface Option<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function DifficultyPicker<T extends string>({ options, value, onChange }: Props<T>) {
  return (
    <div className="difficulty-picker">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={`difficulty-btn ${value === opt.value ? "active" : ""}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
