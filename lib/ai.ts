// Server-only Claude helper. The API key is read from the environment and never
// reaches the browser. `content` is either a plain string or an array of Anthropic
// content blocks (text / document / image) for multimodal calls.
export type AiResult = { ok: true; text: string } | { ok: false; error: string };

export const AI_MODEL = "claude-haiku-4-5-20251001";

export async function callClaude(content: string | unknown[], maxTokens = 600): Promise<AiResult> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return { ok: false, error: "AI is not configured yet — add ANTHROPIC_API_KEY in Netlify to enable this." };
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: AI_MODEL, max_tokens: maxTokens, messages: [{ role: "user", content }] }),
    });
    if (!res.ok) {
      const t = await res.text();
      return { ok: false, error: `Claude API error (${res.status}). ${t.slice(0, 160)}` };
    }
    const data = await res.json();
    const text = (Array.isArray(data?.content) ? data.content.map((b: { text?: string }) => b.text).filter(Boolean).join("\n") : "").trim();
    if (!text) return { ok: false, error: "Claude returned an empty response — try again." };
    return { ok: true, text };
  } catch (e) {
    return { ok: false, error: `Could not reach Claude: ${(e as Error).message}` };
  }
}
