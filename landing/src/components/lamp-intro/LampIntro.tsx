import { useEffect, useRef, useState, type CSSProperties } from "react";
import "./LampIntro.css";

const PALETTE: Record<string, string> = {
  k: "#3d2708",
  d: "#9a6b1c",
  g: "#d9a13c",
  l: "#f7d382",
  w: "#fff3cd",
};

const PIXELS = [
  "..............kkk...............",
  ".............kwlgk..............",
  ".............klggk..............",
  "..............klgk..............",
  "..............kdgk..............",
  "...........kllgggddk............",
  "..........klwlgggdddk...........",
  ".........kgdgdgdgdgdgk..........",
  "kllk....kkllggggggdddkk.........",
  ".kllgk.kllgggggggdddddk.kllgddk.",
  "...klggkllgggggggddddddkkllggddk",
  "......kllggggggggddddddkklk...dk",
  "......kllggggggggddddddkklk...dk",
  ".......kllgggggggddddddkklk...dk",
  "........kllgggggggdddddkkllggddk",
  "..........kkllgggggddkk.kllgddk.",
  "............kggggdddk...........",
  "..........kgdgdgdgdgdgk.........",
  ".........kkllggggggdddkk........",
];

const RUB_DISTANCE = 700;

function LampSprite() {
  return (
    <svg
      className="lamp-sprite"
      viewBox={`0 0 ${PIXELS[0].length} ${PIXELS.length}`}
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {PIXELS.flatMap((row, y) =>
        row.split("").map((char, x) =>
          char === "." ? null : (
            <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={PALETTE[char]} />
          ),
        ),
      )}
    </svg>
  );
}

export function LampIntro({ onEnter }: { onEnter: () => void }) {
  const [progress, setProgress] = useState(0);
  const [released, setReleased] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const rubbed = useRef(0);
  const last = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (progress < 1) return;
    setReleased(true);
    // reveal the landing as the overlay starts fading, so the two crossfade
    const timer = window.setTimeout(onEnter, 1000);
    return () => window.clearTimeout(timer);
  }, [progress, onEnter]);

  function rub(x: number, y: number) {
    if (progress >= 1) return;
    const previous = last.current;
    last.current = { x, y };
    if (previous === null) return;
    rubbed.current += Math.hypot(x - previous.x, y - previous.y);
    setProgress(Math.min(1, rubbed.current / RUB_DISTANCE));
  }

  return (
    <div
      className={`lamp-intro${released ? " is-released" : ""}${skipped ? " is-skipped" : ""}`}
      role="dialog"
      aria-label="Intro"
      inert={released}
      style={{ "--rub": progress } as CSSProperties}
    >
      <div className="lamp-stage">
        <img
          className="lamp-genie"
          src="/mascot/rick-idle.webp"
          alt=""
          width="256"
          height="256"
          aria-hidden="true"
        />
        <button
          type="button"
          className="lamp-button"
          onPointerMove={(event) => rub(event.clientX, event.clientY)}
          onPointerLeave={() => {
            last.current = null;
          }}
          onClick={(event) => {
            // detail === 0 means keyboard activation: no pointer to rub with
            if (event.detail === 0) setProgress(1);
          }}
          aria-label="Frotá la lámpara para invocar al genio"
        >
          <LampSprite />
        </button>
      </div>
      <p className="lamp-hint" aria-live="polite">
        {progress >= 1 ? "Deseo concedido." : "Frotá la lámpara"}
      </p>
      <div className="lamp-meter" aria-hidden="true">
        <span style={{ transform: `scaleX(${progress})` }} />
      </div>
      <button
        type="button"
        className="lamp-skip"
        onClick={() => {
          setSkipped(true);
          setReleased(true);
          onEnter();
        }}
      >
        Saltar intro
      </button>
    </div>
  );
}
