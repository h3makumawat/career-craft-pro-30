import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: () =>
        new Response(
          JSON.stringify({
            status: "ok",
            service: "careercraft-ai-backend",
            aiConfigured: Boolean(process.env["LOVABLE_API_KEY"]),
            time: new Date().toISOString(),
          }),
          { headers: { "content-type": "application/json", "cache-control": "no-store" } },
        ),
    },
  },
});
