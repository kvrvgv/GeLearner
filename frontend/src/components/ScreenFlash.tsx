import type { CSSProperties } from "react";

interface Props {
  state: "idle" | "correct" | "wrong" | "invalid";
  durationMs?: number;
}

export function ScreenFlash({ state, durationMs }: Props) {
  if (state === "idle") return null;
  const style = durationMs
    ? ({ "--flash-duration": `${durationMs}ms` } as CSSProperties)
    : undefined;
  return <div className={`screen-flash screen-flash-${state}`} style={style} aria-hidden="true" />;
}
