export const backoffBaseMs = 30_000;
export const backoffMaxMs = 30 * 60_000;

/**
 * Backoff exponencial con jitter parejo: el resultado cae entre la mitad y el
 * total del intervalo calculado. El jitter existe para que muchas
 * instalaciones que perdieron conexión a la vez no vuelvan todas juntas.
 */
export function computeBackoffMs(
  attempt: number,
  random: () => number = Math.random,
): number {
  const safeAttempt = Math.max(0, Math.min(attempt, 20));
  const capped = Math.min(backoffMaxMs, backoffBaseMs * 2 ** safeAttempt);
  return Math.round(capped / 2 + random() * (capped / 2));
}
