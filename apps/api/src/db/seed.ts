import type { SqlClient } from "./client";

interface SeedPerson {
  readonly name: string;
  readonly area: string;
  readonly role: "admin" | "analyst" | "member";
}

interface SeedRule {
  readonly name: string;
  readonly description: string;
  readonly keywords: readonly string[];
  readonly severity: "low" | "medium" | "high" | "critical";
  readonly action: "allow" | "warn" | "replace" | "block";
  readonly enabled?: boolean;
}

interface SeedCompany {
  readonly id: string;
  readonly name: string;
  readonly domain: string;
  readonly industry: string;
  readonly plan: "starter" | "business" | "enterprise";
  readonly status: "active" | "onboarding" | "suspended";
  readonly seats: number;
  readonly code: string;
  readonly people: readonly SeedPerson[];
  readonly rules: readonly SeedRule[];
}

export const seedCompanies: readonly SeedCompany[] = [
  {
    id: "andes-fintech",
    name: "Andes Fintech",
    domain: "andesfintech.com",
    industry: "Servicios financieros",
    plan: "enterprise",
    status: "active",
    seats: 240,
    code: "ANDE-7F3K-2NQ8",
    people: [
      { name: "Valentina Ríos", area: "Seguridad", role: "admin" },
      { name: "Martín Sosa", area: "Riesgo", role: "analyst" },
      { name: "Carla Domínguez", area: "Producto", role: "member" },
      { name: "Nicolás Ferrari", area: "Ingeniería", role: "member" },
    ],
    rules: [
      {
        name: "Modelo de scoring interno",
        description:
          "Variables y umbrales del motor de scoring crediticio propietario.",
        keywords: ["scoring v7", "umbral mora", "modelo Andes-Risk"],
        severity: "critical",
        action: "block",
      },
      {
        name: "Contratos con adquirentes",
        description: "Condiciones comerciales negociadas con procesadoras.",
        keywords: ["fee adquirente", "rebate mensual"],
        severity: "high",
        action: "replace",
      },
    ],
  },
  {
    id: "delta-salud",
    name: "Delta Salud",
    domain: "deltasalud.com.ar",
    industry: "Salud",
    plan: "business",
    status: "active",
    seats: 120,
    code: "DELT-4RB9-XM52",
    people: [
      { name: "Sofía Aguirre", area: "Seguridad", role: "admin" },
      { name: "Diego Ledesma", area: "Sistemas", role: "analyst" },
      { name: "Mariana Ochoa", area: "Historias clínicas", role: "member" },
    ],
    rules: [
      {
        name: "Identificadores de pacientes",
        description: "Números de historia clínica y afiliado.",
        keywords: ["historia clínica", "nro afiliado", "HC-"],
        severity: "critical",
        action: "block",
      },
    ],
  },
  {
    id: "nodo-logistica",
    name: "Nodo Logística",
    domain: "nodologistica.com",
    industry: "Logística",
    plan: "business",
    status: "active",
    seats: 90,
    code: "NODO-8KTV-3P4L",
    people: [
      { name: "Ramiro Quiroga", area: "Seguridad", role: "admin" },
      { name: "Lucía Benítez", area: "Operaciones", role: "analyst" },
      { name: "Pablo Correa", area: "Depósito", role: "member" },
    ],
    rules: [
      {
        name: "Rutas críticas",
        description: "Recorridos y horarios de cargas de alto valor.",
        keywords: ["ruta blindada", "carga de alto valor"],
        severity: "high",
        action: "block",
      },
    ],
  },
  {
    id: "vega-retail",
    name: "Vega Retail",
    domain: "vegaretail.com",
    industry: "Retail",
    plan: "starter",
    status: "active",
    seats: 45,
    code: "VEGA-5HN2-9QRT",
    people: [
      { name: "Camila Ibarra", area: "Tecnología", role: "admin" },
      { name: "Hernán Ponce", area: "Marketing", role: "member" },
    ],
    rules: [
      {
        name: "Campañas no lanzadas",
        description: "Nombres y fechas de campañas embargadas.",
        keywords: ["campaña Nebula", "lanzamiento Q4"],
        severity: "medium",
        action: "warn",
      },
    ],
  },
  {
    id: "praxis-legal",
    name: "Praxis Legal",
    domain: "praxislegal.com.ar",
    industry: "Servicios legales",
    plan: "business",
    status: "active",
    seats: 60,
    code: "PRAX-2WJ6-LK8D",
    people: [
      { name: "Esteban Arrieta", area: "Seguridad", role: "admin" },
      { name: "Paula Villarreal", area: "Litigios", role: "analyst" },
      { name: "Tomás Bianchi", area: "Corporativo", role: "member" },
    ],
    rules: [
      {
        name: "Causas bajo reserva",
        description: "Carátulas y expedientes con reserva judicial.",
        keywords: ["expediente reservado", "causa 2026/"],
        severity: "critical",
        action: "block",
      },
      {
        name: "Honorarios pactados",
        description: "Esquemas de honorarios por cliente.",
        keywords: ["honorario pactado", "success fee"],
        severity: "medium",
        action: "warn",
        enabled: false,
      },
    ],
  },
  {
    id: "kestrel-energy",
    name: "Kestrel Energy",
    domain: "kestrelenergy.com",
    industry: "Energía",
    plan: "enterprise",
    status: "active",
    seats: 310,
    code: "KEST-9DQ4-7VBN",
    people: [
      { name: "Andrés Molina", area: "Seguridad", role: "admin" },
      { name: "Verónica Sandoval", area: "SOC", role: "analyst" },
      { name: "Leandro Ávila", area: "Plantas", role: "member" },
      { name: "Florencia Duarte", area: "Ingeniería", role: "member" },
    ],
    rules: [
      {
        name: "Infraestructura SCADA",
        description: "Direcciones, tags y credenciales de sistemas de control.",
        keywords: ["tag SCADA", "PLC-", "red OT"],
        severity: "critical",
        action: "block",
      },
    ],
  },
  {
    id: "lumen-educacion",
    name: "Lumen Educación",
    domain: "lumeneduca.com",
    industry: "Educación",
    plan: "starter",
    status: "onboarding",
    seats: 35,
    code: "LUME-6XCF-1TG3",
    people: [
      { name: "Natalia Godoy", area: "Dirección", role: "admin" },
      { name: "Ezequiel Ramos", area: "Sistemas", role: "analyst" },
    ],
    rules: [
      {
        name: "Datos de estudiantes",
        description: "Legajos y datos de contacto de alumnado.",
        keywords: ["legajo alumno", "listado de curso"],
        severity: "high",
        action: "block",
      },
    ],
  },
  {
    id: "terra-agro",
    name: "Terra Agro",
    domain: "terraagro.com.ar",
    industry: "Agroindustria",
    plan: "business",
    status: "suspended",
    seats: 75,
    code: "TERR-3MZP-5YW7",
    people: [
      { name: "Joaquín Peralta", area: "Seguridad", role: "admin" },
      { name: "Milagros Acuña", area: "Agronomía", role: "member" },
    ],
    rules: [
      {
        name: "Contratos de acopio",
        description: "Precios y volúmenes acordados con productores.",
        keywords: ["contrato de acopio", "precio pizarra interno"],
        severity: "medium",
        action: "warn",
      },
    ],
  },
];

export function emailFor(name: string, domain: string): string {
  return `${name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .split(/\s+/u)
    .join(".")}@${domain}`;
}

/**
 * Idempotente: se puede correr sobre una base ya poblada sin duplicar nada ni
 * pisar los usuarios que se hayan enrolado por su cuenta.
 */
export async function seed(client: SqlClient): Promise<void> {
  for (const company of seedCompanies) {
    await client.query(
      `insert into companies (id, name, domain, industry, plan, status, seats)
       values ($1, $2, $3, $4, $5, $6, $7)
       on conflict (id) do update set
         name = excluded.name,
         domain = excluded.domain,
         industry = excluded.industry,
         plan = excluded.plan,
         status = excluded.status,
         seats = excluded.seats`,
      [
        company.id,
        company.name,
        company.domain,
        company.industry,
        company.plan,
        company.status,
        company.seats,
      ],
    );

    await client.query(
      `insert into enrollment_codes (code, company_id)
       values ($1, $2)
       on conflict (code) do nothing`,
      [company.code, company.id],
    );

    for (const person of company.people) {
      await client.query(
        `insert into users (company_id, email, name, area, role)
         values ($1, $2, $3, $4, $5)
         on conflict (company_id, email) do update set
           name = excluded.name,
           area = excluded.area,
           role = excluded.role`,
        [
          company.id,
          emailFor(person.name, company.domain),
          person.name,
          person.area,
          person.role,
        ],
      );
    }

    for (const rule of company.rules) {
      const existing = await client.query<{ id: string }>(
        `select id from custom_rules where company_id = $1 and name = $2`,
        [company.id, rule.name],
      );
      if (existing.length > 0) continue;

      await client.query(
        `insert into custom_rules
           (company_id, name, description, keywords, severity, action, enabled)
         values ($1, $2, $3, $4::jsonb, $5, $6, $7)`,
        [
          company.id,
          rule.name,
          rule.description,
          JSON.stringify(rule.keywords),
          rule.severity,
          rule.action,
          rule.enabled ?? true,
        ],
      );
    }
  }
}
