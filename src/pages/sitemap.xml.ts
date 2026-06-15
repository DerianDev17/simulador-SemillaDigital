import type { APIRoute } from "astro";

const publicRoutes = [
  "/",
  "/categorias",
  "/simulacros",
  "/aprende",
  "/conceptos-base",
  "/preguntas-al-azar",
  "/repaso-dirigido",
  "/practica-enfocada",
  "/ritmo-constante",
  "/supera-tus-limites"
];

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export const GET: APIRoute = ({ site, url }) => {
  const origin = site?.origin ?? url.origin;
  const today = new Date().toISOString().slice(0, 10);
  const urls = publicRoutes
    .map((route) => {
      const loc = route === "/" ? `${origin}/` : `${origin}${route}`;
      return [
        "  <url>",
        `    <loc>${escapeXml(loc)}</loc>`,
        `    <lastmod>${today}</lastmod>`,
        "    <changefreq>weekly</changefreq>",
        route === "/" ? "    <priority>1.0</priority>" : "    <priority>0.8</priority>",
        "  </url>"
      ].join("\n");
    })
    .join("\n");

  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600"
    }
  });
};
