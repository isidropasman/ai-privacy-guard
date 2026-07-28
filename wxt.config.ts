import { defineConfig } from "wxt";

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "AI Privacy Guard",
    description: "Usá la IA. No filtres información confidencial.",
    version: "0.1.0",
    permissions: ["storage"],
    host_permissions: ["https://chatgpt.com/*", "https://chat.openai.com/*"],
    web_accessible_resources: [
      {
        resources: ["mascot/*.webp"],
        matches: ["https://chatgpt.com/*", "https://chat.openai.com/*"],
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
