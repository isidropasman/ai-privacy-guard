export type AccessChannel =
  | {
      readonly status: "available";
      readonly href: string;
    }
  | {
      readonly status: "unavailable";
    };

export function resolveAccessChannel(value: unknown): AccessChannel {
  if (typeof value !== "string" || value.trim() === "") {
    return { status: "unavailable" };
  }

  const href = value.trim();

  if (!URL.canParse(href)) {
    return { status: "unavailable" };
  }

  const url = new URL(href);

  return url.protocol === "https:"
    ? { status: "available", href }
    : { status: "unavailable" };
}

export const accessChannel = resolveAccessChannel(
  import.meta.env.VITE_REDACTA_ACCESS_URL,
);
