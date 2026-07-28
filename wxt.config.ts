import { defineConfig } from "wxt";

/**
 * El host del API es el mismo para todas las empresas, así que puede quedar
 * fijo en el manifest. Lo que varía por empresa viaja en `config.json`, que el
 * dashboard inyecta al generar el paquete.
 */
const apiHost = process.env.WXT_API_HOST ?? "http://localhost:8787/*";

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "AI Privacy Guard",
    description: "Usá la IA. No filtres información confidencial.",
    version: "0.1.0",
    icons: {
      16: "icon/16.png",
      32: "icon/32.png",
      48: "icon/48.png",
      96: "icon/96.png",
      128: "icon/128.png",
    },
    permissions: ["storage", "alarms"],
    host_permissions: [
      "https://chatgpt.com/*",
      "https://chat.openai.com/*",
      "https://claude.ai/*",
      "https://gemini.google.com/*",
      apiHost,
    ],
    web_accessible_resources: [
      {
        resources: ["mascot/*.webp"],
        matches: [
          "https://chatgpt.com/*",
          "https://chat.openai.com/*",
          "https://claude.ai/*",
          "https://gemini.google.com/*",
        ],
      },
    ],
    action: {
      default_title: "AI Privacy Guard",
    },
    content_security_policy: {
      extension_pages: "script-src 'self'; object-src 'self';",
    },
  },
});
