/**
 * Client-side result store (localStorage). Keeps the dashboard populated
 * between pages without introducing a database this project does not need.
 */
import { useCallback, useEffect, useState } from "react";

import type { InterviewSet, LinkedInAnalysis, ResumeAnalysis } from "./schemas";

const KEYS = {
  resume: "careercraft:resume",
  linkedin: "careercraft:linkedin",
  interview: "careercraft:interview",
} as const;

const EVENT = "careercraft:store-change";

function read<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* storage unavailable — results still render for the current session */
  }
}

export const store = {
  saveResume: (v: ResumeAnalysis) => write(KEYS.resume, v),
  saveLinkedIn: (v: LinkedInAnalysis) => write(KEYS.linkedin, v),
  saveInterview: (v: InterviewSet) => write(KEYS.interview, v),
  clear: () => {
    Object.values(KEYS).forEach((k) => window.localStorage.removeItem(k));
    window.dispatchEvent(new Event(EVENT));
  },
};

export function useCareerData() {
  const [state, setState] = useState<{
    resume: ResumeAnalysis | null;
    linkedin: LinkedInAnalysis | null;
    interview: InterviewSet | null;
    ready: boolean;
  }>({ resume: null, linkedin: null, interview: null, ready: false });

  const refresh = useCallback(() => {
    setState({
      resume: read<ResumeAnalysis>(KEYS.resume),
      linkedin: read<LinkedInAnalysis>(KEYS.linkedin),
      interview: read<InterviewSet>(KEYS.interview),
      ready: true,
    });
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener(EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [refresh]);

  return { ...state, refresh };
}
