const benefits = [
  {
    glyph: "⌁",
    label: "Sin fricción",
    title: "Trabajá como siempre",
    text: "Redacta aparece únicamente cuando encuentra algo que puede ser riesgoso.",
  },
  {
    glyph: "▦",
    label: "Protección útil",
    title: "No bloquea por bloquear",
    text: "Anonimiza los datos y conserva el significado para que puedas seguir usando la IA.",
  },
  {
    glyph: "⌂",
    label: "Privacidad local",
    title: "El análisis ocurre en tu navegador",
    text: "El contenido no necesita viajar a otro servidor para saber si es sensible.",
  },
] as const;

export function Benefits() {
  return (
    <section className="benefits section" aria-labelledby="benefits-title">
      <h2 className="sr-only" id="benefits-title">Beneficios</h2>
      {benefits.map((benefit) => (
        <article key={benefit.label}>
          <div className="benefit-glyph" aria-hidden="true">{benefit.glyph}</div>
          <p className="eyebrow">{benefit.label}</p>
          <h3>{benefit.title}</h3>
          <p>{benefit.text}</p>
        </article>
      ))}
    </section>
  );
}
