/**
 * AI service layer: prompt assembly, LLM call, strict response validation.
 * Route handlers stay thin and only call into these functions.
 */
import {
  AiServiceError,
  callLlm,
  parseJsonResponse,
  type ChatMessage,
} from "./ai-gateway.server";
import {
  INTERVIEW_SYSTEM_PROMPT,
  LINKEDIN_SYSTEM_PROMPT,
  RESUME_SYSTEM_PROMPT,
  buildInterviewUserPrompt,
  buildLinkedInUserPrompt,
  buildResumeUserPrompt,
} from "./prompts";
import {
  MAX_FILE_BYTES,
  MIN_RESUME_CHARS,
  base64ToBytes,
  extractDocxText,
  normalizeText,
} from "./resume-parser.server";
import {
  interviewSetSchema,
  linkedinAnalysisSchema,
  resumeAnalysisSchema,
  type InterviewRequest,
  type InterviewSet,
  type LinkedInAnalysis,
  type LinkedInRequest,
  type ResumeAnalysis,
  type ResumeRequest,
} from "./schemas";
import type { TypeOf, ZodTypeAny } from "zod";

function validate<S extends ZodTypeAny>(schema: S, value: unknown): TypeOf<S> {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new AiServiceError(
      "The AI response did not match the expected format. Please try again.",
      502,
    );
  }
  return result.data;
}

export async function analyzeResume(input: ResumeRequest): Promise<ResumeAnalysis> {
  const bytes = base64ToBytes(input.fileBase64);
  if (bytes.byteLength === 0) {
    throw new AiServiceError("The uploaded file is empty.", 400);
  }
  if (bytes.byteLength > MAX_FILE_BYTES) {
    throw new AiServiceError("The file is larger than the 5 MB limit.", 413);
  }

  let userContent: ChatMessage["content"];

  if (input.fileType === "docx") {
    let text: string;
    try {
      text = normalizeText(extractDocxText(bytes));
    } catch (error) {
      throw new AiServiceError(
        error instanceof Error ? error.message : "This DOCX file could not be read.",
        400,
      );
    }
    if (text.length < MIN_RESUME_CHARS) {
      throw new AiServiceError(
        "We could only extract very little text from this document. Please upload a text-based resume (not a scanned image).",
        422,
      );
    }
    userContent = buildResumeUserPrompt(text, input.targetRole);
  } else {
    const header = String.fromCharCode(...bytes.slice(0, 5));
    if (!header.startsWith("%PDF")) {
      throw new AiServiceError("This file is not a valid PDF document.", 400);
    }
    // PDFs are sent to the multimodal model as a document part; the model reads
    // the embedded text layer. Scanned-image PDFs are reported by the model.
    userContent = [
      {
        type: "text",
        text:
          buildResumeUserPrompt(
            "(the resume is attached as a PDF document — read its text content)",
            input.targetRole,
          ) +
          "\n\nIf the attached PDF contains no extractable text (e.g. a scanned image), set all scores to 0 and say so clearly in weaknesses.",
      },
      {
        type: "file",
        file: {
          filename: input.fileName,
          file_data: `data:application/pdf;base64,${
            input.fileBase64.includes(",")
              ? input.fileBase64.slice(input.fileBase64.indexOf(",") + 1)
              : input.fileBase64
          }`,
        },
      },
    ];
  }

  const raw = await callLlm([
    { role: "system", content: RESUME_SYSTEM_PROMPT },
    { role: "user", content: userContent },
  ]);

  const analysis = validate(resumeAnalysisSchema, parseJsonResponse(raw));
  return { ...analysis, fileName: input.fileName, createdAt: new Date().toISOString() };
}

export async function analyzeLinkedIn(input: LinkedInRequest): Promise<LinkedInAnalysis> {
  const raw = await callLlm([
    { role: "system", content: LINKEDIN_SYSTEM_PROMPT },
    { role: "user", content: buildLinkedInUserPrompt(input) },
  ]);
  const analysis = validate(linkedinAnalysisSchema, parseJsonResponse(raw));
  return {
    ...analysis,
    originalHeadline: input.headline,
    originalAbout: input.about,
    profileUrl: input.profileUrl,
    createdAt: new Date().toISOString(),
  };
}

export async function generateInterview(input: InterviewRequest): Promise<InterviewSet> {
  const raw = await callLlm([
    { role: "system", content: INTERVIEW_SYSTEM_PROMPT },
    { role: "user", content: buildInterviewUserPrompt(input) },
  ]);
  const set = validate(interviewSetSchema, parseJsonResponse(raw));
  return {
    ...set,
    role: set.role || input.role,
    experienceLevel: set.experienceLevel || input.experienceLevel,
    createdAt: new Date().toISOString(),
  };
}
