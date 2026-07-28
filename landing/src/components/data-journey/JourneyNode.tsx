import type { ReactNode } from "react";

type JourneyNodeTone = "neutral" | "safe" | "risk";

interface JourneyNodeProps {
  readonly label: string;
  readonly detail: string;
  readonly icon: ReactNode;
  readonly active: boolean;
  readonly current: boolean;
  readonly visited: boolean;
  readonly disabled?: boolean;
  readonly tone?: JourneyNodeTone;
}

export function JourneyNode({
  label,
  detail,
  icon,
  active,
  current,
  visited,
  disabled = false,
  tone = "neutral",
}: JourneyNodeProps) {
  const state = disabled
    ? "disabled"
    : active
      ? "active"
      : visited
        ? "visited"
        : "waiting";

  return (
    <li
      className={`journey-node journey-node--${tone} journey-node--${state}`}
      aria-current={current ? "step" : undefined}
      aria-disabled={disabled || undefined}
    >
      <span className="journey-node__icon" aria-hidden="true">
        {icon}
      </span>
      <span className="journey-node__copy">
        <strong>{label}</strong>
        <small>{detail}</small>
      </span>
      <span className="journey-node__state" aria-hidden="true">
        {disabled ? "—" : visited ? "✓" : active ? "●" : "○"}
      </span>
    </li>
  );
}
