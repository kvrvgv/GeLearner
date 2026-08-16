import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

interface Tab {
  key: string;
  label: string;
  content: ReactNode;
}

interface Props {
  tabs: Tab[];
}

export function SettingsMenu({ tabs }: Props) {
  const [open, setOpen] = useState(false);
  const [activeKey, setActiveKey] = useState(tabs[0]?.key);
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

  if (tabs.length === 0) return null;

  const active = tabs.find((t) => t.key === activeKey) ?? tabs[0];

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
          {tabs.length > 1 && (
            <div className="settings-tabs">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  className={`settings-tab ${t.key === active.key ? "active" : ""}`}
                  onClick={() => setActiveKey(t.key)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
          <div className="settings-tab-content">{active.content}</div>
        </div>
      )}
    </div>
  );
}
