import { motion, useReducedMotion } from "motion/react";
import { DataJourneySimulator } from "./components/data-journey/DataJourneySimulator";
import { EnterpriseImpactConsole } from "./components/enterprise/EnterpriseImpactConsole";
import { FinalCTA } from "./components/FinalCTA";
import { Footer } from "./components/Footer";
import { IncidentDemo } from "./components/incident-demo/IncidentDemo";
import { Navbar } from "./components/Navbar";
import { PrivacyArchitecture } from "./components/privacy/PrivacyArchitecture";
import { IncidentGallery } from "./components/use-cases/IncidentGallery";
import { siteCopy } from "./data/copy";

export function App() {
  const reduceMotion = useReducedMotion();

  return (
    <>
      <a className="skip-link" href="#main">Saltar al contenido</a>
      <Navbar />
      <main id="main">
        <section
          id="demo"
          className="hero section"
          aria-labelledby="hero-title"
        >
          <motion.div
            className="hero-copy"
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
          >
            <p className="eyebrow">{siteCopy.hero.eyebrow}</p>
            <h1 id="hero-title">{siteCopy.hero.title}</h1>
            <p className="hero-lead">{siteCopy.hero.body}</p>
            <div className="hero-actions">
              <a className="button" href="#incident-simulator">
                Probar simulación
              </a>
              <a className="button button-ghost" href="#como-funciona">
                Seguir el recorrido
              </a>
            </div>
            <ul className="hero-indicators" aria-label="Controles principales">
              {siteCopy.hero.indicators.map((indicator) => (
                <li key={indicator}>
                  <span aria-hidden="true">✓</span>
                  {indicator}
                </li>
              ))}
            </ul>
          </motion.div>
          <motion.div
            id="incident-simulator"
            className="hero-demo"
            initial={reduceMotion ? false : { opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.65, delay: 0.08 }}
          >
            <div className="demo-caption">
              <span>01</span> VISIÓN FUTURA · SIMULACIÓN EDUCATIVA DE ARCHIVO
            </div>
            <IncidentDemo />
          </motion.div>
        </section>
        <div id="como-funciona" className="section-anchor">
          <DataJourneySimulator />
        </div>
        <EnterpriseImpactConsole />
        <IncidentGallery />
        <PrivacyArchitecture />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
