import type {
  DetectionFinding,
  DetectionInput,
  SensitiveDataDetector,
} from "../types";
import { createFinding } from "../finding";
import { givenNames } from "./givenNames";

interface NameSpan {
  readonly start: number;
  readonly end: number;
}

const determiners =
  "la|el|los|las|un|una|unos|unas|mi|tu|su|sus|nuestro|nuestra|este|esta|estos|estas|ese|esa|esos|esas|todos|todas|alguien|nadie|quien|ellos|ellas";
const connectors = `de|del|con|para|por|que|y|o|en|sobre|desde|hasta|me|te|se|le|nos|les|lo`;
// Some given names double as verbs ("esas cosas valen mucho"). A surname is
// never one of these, so blocking the usual complements is enough.
// ponytail: covers the frequent complements, not every one; extend on report.
const complements =
  "mucho|mucha|muchos|muchas|poco|poca|pocos|pocas|mas|menos|nada|todo|toda|bien|mal|tanto|tanta|igual|pena|millones|miles|cero";
const functionWords: ReadonlySet<string> = new Set(
  `${determiners}|${connectors}|${complements}`.split("|"),
);

// Case-insensitive on purpose: people type names in lowercase. Capitalization
// can't carry the signal, so the word guards below carry it instead.
const verb = String.raw`(?:escrib|contact|envi|mand)(?:ir|ar|[áa]|[íi])?(?:le|les|lo|la|los|las)?`;
const object = String.raw`(?:\s+(?:un|una|el|la)\s+\p{L}+)?`;
const word = String.raw`\p{L}[\p{L}'’-]+`;

const contextualPattern = new RegExp(
  String.raw`\b${verb}${object}\s+a\s+((?!(?:${determiners})\b)${word}(?:\s+(?!(?:${determiners}|${connectors})\b)${word}){1,2})`,
  "giu",
);

const wordPattern = new RegExp(word, "gu");

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function contextualSpans(text: string): NameSpan[] {
  return [...text.matchAll(contextualPattern)].flatMap((match) => {
    const name = match[1];
    if (name === undefined || match.index === undefined) return [];
    const start = match.index + match[0].lastIndexOf(name);
    return [{ start, end: start + name.length }];
  });
}

// A known given name followed by plausible surnames. This is what catches a
// name nobody announced with a verb, in whatever casing it was typed.
function dictionarySpans(text: string): NameSpan[] {
  const words = [...text.matchAll(wordPattern)];
  const spans: NameSpan[] = [];

  for (let index = 0; index < words.length; index += 1) {
    const first = words[index];
    if (first?.index === undefined || !givenNames.has(normalize(first[0]))) {
      continue;
    }

    let last = index;
    while (last - index < 2) {
      const current = words[last];
      const next = words[last + 1];
      if (current?.index === undefined || next?.index === undefined) break;
      const gap = text.slice(current.index + current[0].length, next.index);
      if (gap !== " " || !isSurnameLike(next[0])) break;
      last += 1;
    }

    const tail = words[last];
    if (last === index || tail?.index === undefined) continue;
    spans.push({ start: first.index, end: tail.index + tail[0].length });
    index = last;
  }

  return spans;
}

function isSurnameLike(value: string): boolean {
  return value.length >= 3 && !functionWords.has(normalize(value));
}

export class PersonNameDetector implements SensitiveDataDetector {
  readonly id = "person-name";
  readonly label = "Nombre de persona";

  detect(input: DetectionInput): DetectionFinding[] {
    const candidates = [
      ...contextualSpans(input.text),
      ...dictionarySpans(input.text),
    ].sort((left, right) => left.start - right.start || right.end - left.end);

    // Both rules fire on the same name whenever a verb introduces it, and
    // RedactionEngine cannot splice overlapping spans.
    const spans = candidates.filter((span, position) =>
      candidates
        .slice(0, position)
        .every((kept) => span.start >= kept.end || span.end <= kept.start),
    );

    return spans.map((span, index) =>
      createFinding({
        detectorId: this.id,
        index,
        category: "person-name",
        severity: "medium",
        confidence: 0.85,
        start: span.start,
        end: span.end,
        safePreview: "Nombre de persona oculto",
        explanation: "El texto incluye un nombre personal.",
        suggestedReplacement: "[PERSON_NAME]",
      }),
    );
  }
}
