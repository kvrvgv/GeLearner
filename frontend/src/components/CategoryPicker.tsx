import type { Category } from "../types";

interface Props {
  categories: Category[];
  selected: Set<string>;
  onChange: (selected: Set<string>) => void;
}

export function CategoryPicker({ categories, selected, onChange }: Props) {
  const allSelected = selected.size === categories.length;

  function toggle(slug: string) {
    const next = new Set(selected);
    if (next.has(slug)) {
      if (next.size > 1) next.delete(slug);
    } else {
      next.add(slug);
    }
    onChange(next);
  }

  function toggleAll() {
    if (allSelected) {
      onChange(new Set([categories[0].slug]));
    } else {
      onChange(new Set(categories.map((c) => c.slug)));
    }
  }

  return (
    <div className="category-picker">
      <button
        className={`chip chip-all ${allSelected ? "active" : ""}`}
        onClick={toggleAll}
        type="button"
      >
        Все темы
      </button>
      {categories.map((c) => (
        <button
          key={c.slug}
          className={`chip ${selected.has(c.slug) ? "active" : ""}`}
          onClick={() => toggle(c.slug)}
          type="button"
        >
          {c.name}
        </button>
      ))}
    </div>
  );
}
