import { describe, expect, test } from "vitest";
import { ArgentineIdentityDetector } from "../../../src/detection/detectors/ArgentineIdentityDetector";
import { ConfidentialKeywordDetector } from "../../../src/detection/detectors/ConfidentialKeywordDetector";
import { EmailDetector } from "../../../src/detection/detectors/EmailDetector";
import { FinancialInformationDetector } from "../../../src/detection/detectors/FinancialInformationDetector";
import { PhoneDetector } from "../../../src/detection/detectors/PhoneDetector";
import { PersonNameDetector } from "../../../src/detection/detectors/PersonNameDetector";

describe("warning detectors", () => {
  test("detects email without exposing it in preview", () => {
    const findings = new EmailDetector().detect({
      text: "Contactá a juan.perez@example.com.",
      configuredTerms: [],
    });

    expect(findings[0]).toMatchObject({
      category: "email",
      severity: "medium",
      safePreview: "j•••@example.com",
      suggestedReplacement: "[EMAIL_CONTACT]",
    });
  });

  test("detects contextual phone and ignores an isolated short number", () => {
    const detector = new PhoneDetector();

    expect(
      detector.detect({
        text: "Mi teléfono es +54 11 5555-1234",
        configuredTerms: [],
      }),
    ).toHaveLength(1);
    expect(
      detector.detect({ text: "El código es 12345", configuredTerms: [] }),
    ).toEqual([]);
  });

  test.each([
    ["DNI 30123456", "dni"],
    ["CUIT 20-12345678-6", "tax-id"],
    ["CBU 2850590940090418135201", "bank-account"],
    ["Alias bancario: cliente.acme.pagos", "bank-account"],
  ])("detects contextual Argentine identity data: %s", (text, category) => {
    const findings = new ArgentineIdentityDetector().detect({
      text,
      configuredTerms: [],
    });

    expect(findings[0]?.category).toBe(category);
  });

  test("detects a contextual person name for the demo prompt", () => {
    const findings = new PersonNameDetector().detect({
      text: "Ayudame a escribirle a Juan Pérez. Su email es juan@example.com.",
      configuredTerms: [],
    });

    expect(findings[0]).toMatchObject({
      category: "person-name",
      suggestedReplacement: "[PERSON_NAME]",
    });
  });

  test("does not warn about an isolated revenue percentage", () => {
    expect(
      new FinancialInformationDetector().detect({
        text: "Mi facturación subió 20%.",
        configuredTerms: [],
      }),
    ).toEqual([]);
  });

  test("warns about confidential financial context", () => {
    const findings = new FinancialInformationDetector().detect({
      text: "Nuestro margen interno para Cliente ACME es 47% y todavía no fue comunicado.",
      configuredTerms: [],
    });

    expect(findings[0]).toMatchObject({
      category: "financial",
      severity: "high",
      suggestedReplacement: "[CONFIDENTIAL_AMOUNT]",
    });
  });

  test("does not consume sentence punctuation after an amount", () => {
    const text =
      "El precio negociado interno es USD 80.000. Todavía no fue anunciado.";
    const [finding] = new FinancialInformationDetector().detect({
      text,
      configuredTerms: [],
    });

    expect(text.slice(finding?.start, finding?.end)).toBe("USD 80.000");
  });

  test("detects every configured term case-insensitively", () => {
    const findings = new ConfidentialKeywordDetector().detect({
      text: "Proyecto Cóndor usa backend-core para Cliente ACME. PROYECTO CÓNDOR sigue privado.",
      configuredTerms: ["Proyecto Cóndor", "backend-core", "Cliente ACME"],
    });

    expect(findings).toHaveLength(4);
    expect(findings.map((finding) => finding.suggestedReplacement)).toEqual([
      "[PROJECT_NAME]",
      "[INTERNAL_TERM]",
      "Cliente [CLIENT_NAME]",
      "[PROJECT_NAME]",
    ]);
  });
});
