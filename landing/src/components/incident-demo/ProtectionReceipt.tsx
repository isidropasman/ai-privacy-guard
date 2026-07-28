import type { IncidentDocument } from "../../data/incidentDemo";

interface ProtectionReceiptProps {
  readonly document: IncidentDocument;
  readonly sent: boolean;
}

const numberFormatter = new Intl.NumberFormat("es-AR");

export function ProtectionReceipt({
  document,
  sent,
}: ProtectionReceiptProps) {
  return (
    <section
      className={`protection-receipt${sent ? " protection-receipt--sent" : ""}`}
      aria-labelledby="protection-receipt-title"
    >
      <span className="protection-receipt-shield" aria-hidden="true">
        ✓
      </span>
      <div>
        <p className="eyebrow">RECIBO DE PROTECCIÓN</p>
        <h3 id="protection-receipt-title">
          {sent ? "Envío protegido completado" : "Versión segura preparada"}
        </h3>
      </div>
      <dl>
        <div>
          <dt>Hallazgos protegidos</dt>
          <dd>{document.findings.length}</dd>
        </div>
        <div>
          <dt>Contenido confidencial</dt>
          <dd>{document.confidentialPercentage}%</dd>
        </div>
        <div>
          <dt>Caracteres protegidos</dt>
          <dd>{numberFormatter.format(document.protectedCharacters)}</dd>
        </div>
      </dl>
      {sent && (
        <p role="status" aria-live="polite">
          Versión segura enviada. Ningún dato original salió del navegador.
        </p>
      )}
    </section>
  );
}
