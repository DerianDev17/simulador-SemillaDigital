import node from "@astrojs/node";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

function memorySessionDriverPlugin() {
  return {
    name: "memory-session-driver",
    enforce: "pre",
    resolveId(id) {
      if (id === "astro-memory-session-driver") {
        return "astro-memory-session-driver";
      }
      return null;
    },
    load(id) {
      if (id === "astro-memory-session-driver") {
        return `
const store = new Map();
export default function createMemorySessionDriver() {
  return {
    async getItem(key) {
      return store.get(key);
    },
    async setItem(key, value) {
      store.set(key, value);
    },
    async removeItem(key) {
      store.delete(key);
    }
  };
}
`;
      }
      return null;
    }
  };
}

export default defineConfig({
  ...(process.env.PUBLIC_SITE_URL ? { site: process.env.PUBLIC_SITE_URL } : {}),
  output: "server",
  adapter: node({
    mode: "standalone"
  }),
  // The app stores admin/game sessions in SQLite. This driver only prevents
  // @astrojs/node from injecting fsLite imports that break on apostrophes in Windows paths.
  session: {
    driver: {
      entrypoint: "astro-memory-session-driver"
    }
  },
  vite: {
    plugins: [memorySessionDriverPlugin(), tailwindcss()]
  }
});
