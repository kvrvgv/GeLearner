interface Props {
  state: "idle" | "correct" | "wrong";
}

export function ScreenFlash({ state }: Props) {
  if (state === "idle") return null;
  return <div className={`screen-flash screen-flash-${state}`} aria-hidden="true" />;
}
