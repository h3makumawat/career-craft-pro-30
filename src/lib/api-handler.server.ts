import { AiServiceError } from "./ai-gateway.server";
import type { ZodTypeAny, TypeOf } from "zod";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
      // Same-origin app; CORS kept explicit and minimal.
      "access-control-allow-origin": process.env["CORS_ALLOW_ORIGIN"] ?? "",
    },
  });
}

/** Thin route wrapper: parse -> validate -> service -> JSON, with safe errors. */
export async function handleJsonRoute<S extends ZodTypeAny, R>(
  request: Request,
  schema: S,
  service: (input: TypeOf<S>) => Promise<R>,
) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Request body must be valid JSON." }, 400);
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return json(
      {
        error: first?.message ?? "The submitted data is invalid.",
        field: first?.path?.join(".") ?? undefined,
      },
      422,
    );
  }

  try {
    return json({ data: await service(parsed.data) });
  } catch (error) {
    if (error instanceof AiServiceError) {
      return json({ error: error.userMessage }, error.status);
    }
    console.error("[api] unexpected error", error instanceof Error ? error.message : error);
    return json({ error: "AI service is temporarily unavailable. Please try again." }, 502);
  }
}
