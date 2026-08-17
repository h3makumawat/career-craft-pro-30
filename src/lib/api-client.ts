/**
 * Centralized API client. Every backend call in the app goes through here.
 * VITE_API_BASE_URL lets the frontend point at a separately hosted backend;
 * when unset it uses same-origin relative paths (default in this deployment).
 */
import type {
  InterviewRequest,
  InterviewSet,
  LinkedInAnalysis,
  LinkedInRequest,
  ResumeAnalysis,
} from "./schemas";

const BASE = (import.meta.env["VITE_API_BASE_URL"] ?? "").replace(/\/$/, "");

export const API_ROUTES = {
  health: "/api/health",
  resumeAnalyze: "/api/resume/analyze",
  linkedinAnalyze: "/api/linkedin/analyze",
  interviewGenerate: "/api/interview/generate",
} as const;

export class ApiError extends Error {
  status: number;
  field?: string | undefined;
  constructor(message: string, status: number, field?: string | undefined) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.field = field;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BASE}${path}`, {
      ...init,
      headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
    });
  } catch {
    throw new ApiError(
      "Cannot reach the CareerCraft AI backend. Check your connection and try again.",
      0,
    );
  }

  const text = await response.text();
  let payload: { data?: T; error?: string; field?: string } | null = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    if (response.status === 404) {
      throw new ApiError(`Backend endpoint ${path} was not found (404).`, 404);
    }
    throw new ApiError(
      payload?.error ?? `The backend returned an error (HTTP ${response.status}).`,
      response.status,
      payload?.field,
    );
  }
  if (!payload || payload.data === undefined) {
    throw new ApiError("The backend returned an unexpected empty response.", 502);
  }
  return payload.data;
}

export type ResumeUpload = {
  fileName: string;
  fileType: "pdf" | "docx";
  fileBase64: string;
  targetRole?: string;
};

export const api = {
  health: () =>
    request<never>(API_ROUTES.health).catch((e) => {
      throw e;
    }),
  analyzeResume: (body: ResumeUpload) =>
    request<ResumeAnalysis>(API_ROUTES.resumeAnalyze, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  analyzeLinkedIn: (body: LinkedInRequest) =>
    request<LinkedInAnalysis>(API_ROUTES.linkedinAnalyze, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  generateInterview: (body: InterviewRequest) =>
    request<InterviewSet>(API_ROUTES.interviewGenerate, {
      method: "POST",
      body: JSON.stringify(body),
    }),
};

export async function checkHealth(): Promise<{ status: string; aiConfigured: boolean } | null> {
  try {
    const res = await fetch(`${BASE}${API_ROUTES.health}`);
    if (!res.ok) return null;
    return (await res.json()) as { status: string; aiConfigured: boolean };
  } catch {
    return null;
  }
}
