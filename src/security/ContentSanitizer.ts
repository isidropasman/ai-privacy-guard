export class ContentSanitizer {
  static normalizeTerm(value: string): string | null {
    const normalized = value.trim();
    if (
      normalized.length === 0 ||
      normalized.length > 100 ||
      /[\u0000-\u001f\u007f]/.test(normalized)
    ) {
      return null;
    }
    return normalized;
  }

  static safePreview(value: string, maxCharacters: number): string {
    const characters = Array.from(value.replace(/[\u0000-\u001f\u007f]/g, " "));
    if (characters.length <= maxCharacters) return characters.join("");
    return `${characters.slice(0, maxCharacters).join("")}…`;
  }
}
