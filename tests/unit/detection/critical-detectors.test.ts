import { describe, expect, test } from "vitest";
import { ApiKeyDetector } from "../../../src/detection/detectors/ApiKeyDetector";
import { ConnectionStringDetector } from "../../../src/detection/detectors/ConnectionStringDetector";
import { CreditCardDetector } from "../../../src/detection/detectors/CreditCardDetector";
import { JwtDetector } from "../../../src/detection/detectors/JwtDetector";
import { PrivateKeyDetector } from "../../../src/detection/detectors/PrivateKeyDetector";

describe("critical detectors", () => {
  test("does not classify an API key explanation as a secret", () => {
    expect(
      new ApiKeyDetector().detect({
        text: "Explicame qué es una API key.",
        configuredTerms: [],
      }),
    ).toEqual([]);
  });

  test.each([
    ["OPENAI_API_KEY=sk-proj-example-for-testing", "api-key"],
    ["OPENAI_API_KEY=sk_12312434sdfsef_test_33ddd", "api-key"],
    ["ANTHROPIC_API_KEY=sk-ant-example-fixture-token", "api-key"],
    ["AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE", "api-key"],
    ["GITHUB_TOKEN=ghp_examplefixturetoken1234567890", "api-key"],
    ["Authorization: Bearer fixtureToken1234567890ABCDE", "api-key"],
    ["GOOGLE_API_KEY=AIzaSyExampleFixtureKey1234567890", "api-key"],
    ["SLACK_TOKEN=xoxb-example-fixture-1234567890", "api-key"],
    ["STRIPE_SECRET=sk_" + "test_examplefixture1234567890", "api-key"],
    ["TWILIO_SECRET=S" + "K0123456789abcdef0123456789abcdef", "api-key"],
    ["PASSWORD=fixture-password", "api-key"],
  ])("detects a credential fixture in %s", (text, detectorId) => {
    const findings = new ApiKeyDetector().detect({
      text,
      configuredTerms: [],
    });

    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({
      detectorId,
      category: "credential",
      severity: "critical",
    });
    expect(findings[0]?.safePreview).not.toContain("fixtureToken");
  });

  test("detects a private key header without exposing its body", () => {
    const text =
      "-----BEGIN PRIVATE KEY-----\nfixture-invalid\n-----END PRIVATE KEY-----";
    const findings = new PrivateKeyDetector().detect({
      text,
      configuredTerms: [],
    });

    expect(findings[0]).toMatchObject({
      category: "private-key",
      severity: "critical",
      suggestedReplacement: "[PRIVATE_KEY_REMOVED]",
    });
  });

  test("accepts JWT structure and rejects ordinary dotted text", () => {
    const detector = new JwtDetector();
    const jwt =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmaXh0dXJlIn0.fixture_signature";

    expect(
      detector.detect({ text: `token=${jwt}`, configuredTerms: [] }),
    ).toHaveLength(1);
    expect(
      detector.detect({
        text: "version 1.2.3 and example.com",
        configuredTerms: [],
      }),
    ).toEqual([]);
  });

  test.each([
    "postgresql://user:fixture-password@localhost:5432/app",
    "mongodb://fixture:password@localhost:27017/db",
    "redis://default:fixture-password@localhost:6379",
  ])("detects credentials in connection string %s", (text) => {
    const findings = new ConnectionStringDetector().detect({
      text,
      configuredTerms: [],
    });

    expect(findings[0]).toMatchObject({
      category: "connection-string",
      severity: "critical",
    });
  });

  test("validates card candidates with Luhn", () => {
    const detector = new CreditCardDetector();

    const findings = detector.detect({
      text: "4111111111111111",
      configuredTerms: [],
    });

    expect(findings[0]).toMatchObject({
      category: "payment-card",
      severity: "critical",
      safePreview: "•••• 1111",
    });
    expect(
      detector.detect({
        text: "4111111111111112",
        configuredTerms: [],
      }),
    ).toEqual([]);
  });
});
