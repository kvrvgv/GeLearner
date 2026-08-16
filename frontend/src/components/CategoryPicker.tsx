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
    <div className="category-list">
      <button
        type="button"
        className={`category-row category-row-all ${allSelected ? "active" : ""}`}
        onClick={toggleAll}
      >
        <span className="category-check" aria-hidden="true" />
        <span>Все темы</span>
      </button>
      <div className="category-list-divider" />
      {categories.map((c) => (
        <button
          key={c.slug}
          type="button"
          className={`category-row ${selected.has(c.slug) ? "active" : ""}`}
          onClick={() => toggle(c.slug)}
        >
          <span className="category-check" aria-hidden="true" />
          <span>{c.name}</span>
        </button>
      ))}
    </div>
  );
}
