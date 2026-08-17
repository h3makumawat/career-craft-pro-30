import { createFileRoute } from "@tanstack/react-router";

import { handleJsonRoute } from "@/lib/api-handler.server";
import { analyzeResume } from "@/lib/career-service.server";
import { resumeRequestSchema } from "@/lib/schemas";

export const Route = createFileRoute("/api/resume/analyze")({
  server: {
    handlers: {
      POST: ({ request }) => handleJsonRoute(request, resumeRequestSchema, analyzeResume),
    },
  },
});
