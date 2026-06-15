import type { APIRoute } from "astro";

const privatePaths = ["/admin/", "/jugar/", "/final", "/detalle-resultado", "/repasar-errores", "/historial"];

export const GET: APIRoute = ({ site, url }) => {
  const origin = site?.origin ?? url.origin;
  const body = [
    "User-agent: *",
    "Allow: /",
    ...privatePaths.map((path) => `Disallow: ${path}`),
    "",
    `Sitemap: ${origin}/sitemap.xml`,
    ""
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600"
    }
  });
};
