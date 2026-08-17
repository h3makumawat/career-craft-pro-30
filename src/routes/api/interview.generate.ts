import { createFileRoute } from "@tanstack/react-router";

import { handleJsonRoute } from "@/lib/api-handler.server";
import { generateInterview } from "@/lib/career-service.server";
import { interviewRequestSchema } from "@/lib/schemas";

export const Route = createFileRoute("/api/interview/generate")({
  server: {
    handlers: {
      POST: ({ request }) => handleJsonRoute(request, interviewRequestSchema, generateInterview),
    },
  },
});
