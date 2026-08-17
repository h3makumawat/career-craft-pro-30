import { createFileRoute } from "@tanstack/react-router";

import { handleJsonRoute } from "@/lib/api-handler.server";
import { analyzeLinkedIn } from "@/lib/career-service.server";
import { linkedinRequestSchema } from "@/lib/schemas";

export const Route = createFileRoute("/api/linkedin/analyze")({
  server: {
    handlers: {
      POST: ({ request }) => handleJsonRoute(request, linkedinRequestSchema, analyzeLinkedIn),
    },
  },
});
