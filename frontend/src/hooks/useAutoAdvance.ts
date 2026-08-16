import { useEffect, useState } from "react";

const STORAGE_KEY = "gelearner-auto-advance";

export function useAutoAdvance() {
  const [autoAdvance, setAutoAdvance] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEY) !== "off";
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, autoAdvance ? "on" : "off");
  }, [autoAdvance]);

  return { autoAdvance, setAutoAdvance };
}
