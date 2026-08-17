/**
 * Server-only LLM service. The API key never leaves this boundary.
 */

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
export const DEFAULT_MODEL = "google/gemini-3.6-flash";

export class AiServiceError extends Error {
  status: number;
  userMessage: string;
  constructor(userMessage: string, status = 502) {
    super(userMessage);
    this.name = "AiServiceError";
    this.status = status;
    this.userMessage = userMessage;
  }
}

type ContentBlock =
  | { type: "text"; text: string }
  | { type: "file"; file: { filename: string; file_data: string } };

export type ChatMessage =
  | { role: "system"; content: string }
  | { role: "user"; content: string | ContentBlock[] };

function requireKey(): string {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) {
    throw new AiServiceError(
      "AI service is not configured on the server (missing API key). Please contact the administrator.",
      500,
    );
  }
  return key;
}

function messageForStatus(status: number, body: string): AiServiceError {
  if (status === 429) {
    return new AiServiceError(
      "The AI service is rate limited right now. Please wait a moment and try again.",
      429,
    );
  }
  if (status === 402) {
    return new AiServiceError(
      "The AI usage allowance for this deployment has been exhausted. The owner needs to add AI credits.",
      402,
    );
  }
  if (status === 403) {
    return new AiServiceError(
      "AI access is blocked by workspace policy for this deployment.",
      403,
    );
  }
  if (status === 401) {
    return new AiServiceError("AI service credentials are invalid on the server.", 500);
  }
  if (status === 400) {
    const tooLarge = /token|too large|limit/i.test(body);
    return new AiServiceError(
      tooLarge
        ? "The submitted document is too large for the AI model. Please shorten it and try again."
        : "The AI service rejected this request. Please check the submitted content and try again.",
      400,
    );
  }
  return new AiServiceError("AI service is temporarily unavailable. Please try again.", 502);
}

/** Calls the LLM and returns raw assistant text. */
export async function callLlm(messages: ChatMessage[], model = DEFAULT_MODEL): Promise<string> {
  const key = requireKey();
  let response: Response;
  try {
    response = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({
        model,
        messages,
        response_format: { type: "json_object" },
      }),
    });
  } catch {
    throw new AiServiceError(
      "Could not reach the AI service (network error). Please try again.",
      503,
    );
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw messageForStatus(response.status, body);
  }

  const data = (await response.json().catch(() => null)) as {
    choices?: { message?: { content?: string } }[];
  } | null;
  const text = data?.choices?.[0]?.message?.content;
  if (!text || !text.trim()) {
    throw new AiServiceError("The AI service returned an empty response. Please try again.", 502);
  }
  return text;
}

/** Extracts the first JSON object from a model response. */
export function parseJsonResponse(raw: string): unknown {
  const cleaned = raw
    .replace(/^\s*```(?:json)?/i, "")
    .replace(/```\s*$/, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch {
        /* fall through */
      }
    }
    throw new AiServiceError(
      "The AI returned a malformed result. Please try again — no partial or fabricated data was used.",
      502,
    );
  }
}
