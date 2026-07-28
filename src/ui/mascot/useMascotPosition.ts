import { useCallback, useEffect, useRef, useState } from "react";

export interface MascotPosition {
  readonly x: number;
  readonly y: number;
}

const STORAGE_KEY = "mascotPosition";
const MASCOT_SIZE = 112;
const DRAG_THRESHOLD_PX = 4;

export function clampMascotPosition(
  position: MascotPosition,
  viewport: { readonly width: number; readonly height: number },
): MascotPosition {
  const maxX = Math.max(viewport.width - MASCOT_SIZE, 0);
  const maxY = Math.max(viewport.height - MASCOT_SIZE, 0);
  return {
    x: Math.min(Math.max(position.x, 0), maxX),
    y: Math.min(Math.max(position.y, 0), maxY),
  };
}

function isPosition(value: unknown): value is MascotPosition {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as MascotPosition).x === "number" &&
    typeof (value as MascotPosition).y === "number"
  );
}

function storage(): { get: typeof browser.storage.local.get; set: typeof browser.storage.local.set } | null {
  return typeof browser === "undefined" ? null : browser.storage.local;
}

export function useMascotPosition() {
  const [position, setPosition] = useState<MascotPosition | null>(null);
  const [ready, setReady] = useState(() => storage() === null);
  const positionRef = useRef<MascotPosition | null>(null);
  const draggedRef = useRef(false);

  const apply = useCallback((next: MascotPosition) => {
    const clamped = clampMascotPosition(next, {
      width: window.innerWidth,
      height: window.innerHeight,
    });
    positionRef.current = clamped;
    setPosition(clamped);
  }, []);

  useEffect(() => {
    let active = true;
    const local = storage();
    if (local === null) return;
    // El genio se mantiene invisible hasta resolver la posición guardada: si no,
    // se pinta en la esquina por defecto y salta, que se lee como un parpadeo.
    void local
      .get(STORAGE_KEY)
      .then((values) => {
        if (!active) return;
        const stored = values[STORAGE_KEY];
        if (isPosition(stored)) apply(stored);
        setReady(true);
      })
      .catch(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, [apply]);

  useEffect(() => {
    const reclamp = () => {
      if (positionRef.current !== null) apply(positionRef.current);
    };
    window.addEventListener("resize", reclamp);
    return () => window.removeEventListener("resize", reclamp);
  }, [apply]);

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (event.button !== 0) return;
      const handle = event.currentTarget;
      const rect = handle.getBoundingClientRect();
      const grabX = event.clientX - rect.left;
      const grabY = event.clientY - rect.top;
      const startX = event.clientX;
      const startY = event.clientY;
      draggedRef.current = false;
      handle.setPointerCapture(event.pointerId);

      const onMove = (move: PointerEvent) => {
        if (
          Math.abs(move.clientX - startX) + Math.abs(move.clientY - startY) >
          DRAG_THRESHOLD_PX
        ) {
          draggedRef.current = true;
        }
        if (!draggedRef.current) return;
        apply({ x: move.clientX - grabX, y: move.clientY - grabY });
      };
      const onUp = () => {
        handle.removeEventListener("pointermove", onMove);
        handle.removeEventListener("pointerup", onUp);
        handle.removeEventListener("pointercancel", onUp);
        if (draggedRef.current && positionRef.current !== null) {
          void storage()?.set({ [STORAGE_KEY]: positionRef.current });
        }
      };

      handle.addEventListener("pointermove", onMove);
      handle.addEventListener("pointerup", onUp);
      handle.addEventListener("pointercancel", onUp);
    },
    [apply],
  );

  const consumeDrag = useCallback(() => {
    const dragged = draggedRef.current;
    draggedRef.current = false;
    return dragged;
  }, []);

  const style: React.CSSProperties = {
    ...(position === null
      ? {}
      : { left: position.x, top: position.y, right: "auto", bottom: "auto" }),
    ...(ready ? {} : { visibility: "hidden" }),
  };

  return { style, onPointerDown, consumeDrag };
}
