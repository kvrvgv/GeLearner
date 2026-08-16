import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

interface Section {
  key: string;
  label: string;
  content: ReactNode;
  /** Tucked behind a collapsible toggle instead of shown directly. Ignored when it's the only section. */
  collapsible?: boolean;
  badge?: string;
}

interface Props {
  sections: Section[];
  onResetStats?: () => void;
}

export function SettingsMenu({ sections, onResetStats }: Props) {
  const [open, setOpen] = useState(false);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  if (sections.length === 0) return null;

  const single = sections.length === 1;

  return (
    <div className="settings-menu" ref={ref}>
      <button
        type="button"
        className={`settings-toggle ${open ? "active" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-label="Настройки"
        aria-expanded={open}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M3 5.5h14M3 10h14M3 14.5h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div className="settings-dropdown">
          {sections.map((section) => {
            if (single || !section.collapsible) {
              return (
                <div key={section.key} className="settings-section">
                  {!single && <div className="settings-section-label">{section.label}</div>}
                  {section.content}
                </div>
              );
            }

            const isExpanded = expandedKey === section.key;
            return (
              <div key={section.key} className="settings-section">
                <button
                  type="button"
                  className={`settings-accordion-toggle ${isExpanded ? "open" : ""}`}
                  onClick={() => setExpandedKey(isExpanded ? null : section.key)}
                  aria-expanded={isExpanded}
                >
                  <span>{section.label}</span>
                  <span className="settings-accordion-right">
                    {section.badge && <span className="settings-accordion-badge">{section.badge}</span>}
                    <svg
                      className="settings-chevron"
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M3.5 5.5L7 9l3.5-3.5"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </button>
                {isExpanded && <div className="settings-accordion-body">{section.content}</div>}
              </div>
            );
          })}

          {onResetStats && (
            <button
              type="button"
              className="settings-reset-btn"
              onClick={() => {
                onResetStats();
                setOpen(false);
              }}
            >
              Сбросить счётчик
            </button>
          )}
        </div>
      )}
    </div>
  );
}
