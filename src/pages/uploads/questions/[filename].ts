import type { APIRoute } from "astro";
import { getStoredQuestionImage } from "@/lib/uploads";

export const GET: APIRoute = async ({ params }) => {
  const filename = params.filename;
  if (!filename) {
    return new Response("Not found", { status: 404 });
  }

  const image = await getStoredQuestionImage(filename);
  if (!image) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(new Uint8Array(image.bytes), {
    headers: {
      "Content-Type": image.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff"
    }
  });
};
