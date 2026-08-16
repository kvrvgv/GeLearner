import { useEffect, useState } from "react";

export type ThemePref = "light" | "dark" | "auto";

const STORAGE_KEY = "gelearner-theme";

function resolveTheme(pref: ThemePref): "light" | "dark" {
  if (pref === "auto") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return pref;
}

function applyTheme(pref: ThemePref) {
  document.documentElement.setAttribute("data-theme", resolveTheme(pref));
}

export function useTheme() {
  const [theme, setTheme] = useState<ThemePref>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "light" || stored === "dark" || stored === "auto" ? stored : "auto";
  });

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem(STORAGE_KEY, theme);

    if (theme === "auto") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => applyTheme("auto");
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, [theme]);

  return { theme, setTheme };
}
