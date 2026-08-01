import { generateText } from "ai";

export const config = { runtime: "nodejs" };

const MAX_TEXT_LENGTH = 2000;

const SYSTEM_PROMPT =
  "You are a translator. Translate the user's text into natural English. " +
  "If the text is already English, return it unchanged. " +
  "Reply with only the translation, no quotes, no explanations.";

export default async function handler(req: Request): Promise<Response> {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  try {
    const { text } = (await req.json()) as { text?: unknown };

    if (!text || typeof text !== "string") {
      return new Response(JSON.stringify({ error: "Missing text" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }
    if (text.length > MAX_TEXT_LENGTH) {
      return new Response(JSON.stringify({ error: "Text too long" }), {
        status: 413,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    if (!process.env.AI_GATEWAY_API_KEY) {
      return new Response(JSON.stringify({ error: "AI gateway not configured" }), {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // Routes through the Vercel AI Gateway via a plain model string.
    const { text: translation } = await generateText({
      model: "google/gemini-2.5-flash-lite",
      system: SYSTEM_PROMPT,
      prompt: text,
    });

    return new Response(
      JSON.stringify({ translation: (translation ?? text).trim() }),
      { headers: { ...cors, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("[v0] translate error:", e);
    return new Response(JSON.stringify({ error: "Translation failed" }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
}
