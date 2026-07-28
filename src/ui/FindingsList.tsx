import type { DetectionFinding, SensitiveCategory } from "../detection/types";

interface FindingsListProps {
  readonly findings: readonly DetectionFinding[];
}

export function FindingsList({ findings }: FindingsListProps) {
  const unique = [
    ...new Map(findings.map((finding) => [finding.category, finding])).values(),
  ];

  return (
    <ul className="findings" aria-label="Información encontrada">
      {unique.map((finding) => (
        <li key={finding.category}>
          <span className={`finding-mark finding-mark--${finding.severity}`} />
          <span>
            <strong>{categoryLabels[finding.category]}</strong>
            <small>{finding.explanation}</small>
          </span>
          <span className="finding-preview">{finding.safePreview}</span>
        </li>
      ))}
    </ul>
  );
}

const categoryLabels: Record<SensitiveCategory, string> = {
  credential: "Credencial de acceso",
  "private-key": "Clave privada",
  jwt: "Token de sesión",
  "connection-string": "Conexión con credenciales",
  "payment-card": "Tarjeta de pago",
  email: "Email de contacto",
  "person-name": "Nombre de persona",
  phone: "Número de teléfono",
  dni: "Documento de identidad",
  "tax-id": "CUIT o CUIL",
  "bank-account": "Dato bancario",
  financial: "Información financiera interna",
  "confidential-term": "Término confidencial",
};
