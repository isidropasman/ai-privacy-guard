import { motion, useReducedMotion } from "motion/react";
import { useCallback, useState } from "react";
import { ApiKeyLeakSimulator } from "./components/api-key-leak/ApiKeyLeakSimulator";
import { LampIntro } from "./components/lamp-intro/LampIntro";
import { FinalCTA } from "./components/FinalCTA";
import { Footer } from "./components/Footer";
import { Navbar } from "./components/Navbar";
import { ProviderShowcase } from "./components/providers/ProviderShowcase";
import { IncidentGallery } from "./components/use-cases/IncidentGallery";
import { siteCopy } from "./data/copy";

export function App() {
  const reduceMotion = useReducedMotion();
  const [revealed, setRevealed] = useState(false);
  const reveal = useCallback(() => setRevealed(true), []);

  return (
    <>
      <LampIntro onEnter={reveal} />
      <div className="site-shell" data-revealed={revealed} inert={!revealed}>
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
                <a className="button" href="#casos">
                  Probar simulación
                </a>
                <a className="button button-ghost" href="#como-funciona">
                  Seguir el recorrido
                </a>
              </div>
            </motion.div>
            <motion.img
              className="hero-portrait"
              src="/mascot/rick-idle.webp"
              alt=""
              width="256"
              height="256"
              aria-hidden="true"
              initial={reduceMotion ? false : { opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.55 }}
            />
          </section>
          <IncidentGallery />
          <ProviderShowcase />
          <ApiKeyLeakSimulator />
          <FinalCTA />
        </main>
        <Footer />
      </div>
    </>
  );
}
