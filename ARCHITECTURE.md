# CareerCraft AI — Architecture

## System overview

```mermaid
flowchart TD
    U["User browser<br/>(mobile / tablet / desktop)"]
    UI["React UI<br/>Home · Resume Analyzer · LinkedIn Coach<br/>Interview Prep · Dashboard · About"]
    C["Centralized API client<br/>src/lib/api-client.ts"]
    LS[("Browser localStorage<br/>saved results for dashboard")]

    R1["POST /api/resume/analyze"]
    R2["POST /api/linkedin/analyze"]
    R3["POST /api/interview/generate"]
    R4["GET /api/health"]

    V["Zod request schemas<br/>src/lib/schemas.ts"]
    S["Service layer<br/>career-service.server.ts"]
    P["Prompt templates<br/>prompts.ts"]
    D["Document parser<br/>resume-parser.server.ts"]
    G["LLM service<br/>ai-gateway.server.ts<br/>(reads LOVABLE_API_KEY)"]
    L["LLM provider API"]

    U --> UI --> C
    UI <--> LS
    C --> R1 & R2 & R3 & R4
    R1 & R2 & R3 --> V --> S
    S --> P
    S --> D
    S --> G --> L
    L -->|JSON| G -->|validated| S --> C

    subgraph Server["Server (never exposed to browser)"]
        R1
        R2
        R3
        R4
        V
        S
        P
        D
        G
    end
```

## Resume analysis sequence

```mermaid
sequenceDiagram
    participant B as Browser
    participant A as /api/resume/analyze
    participant SV as Service layer
    participant PR as Parser
    participant AI as LLM provider

    B->>B: validate type (.pdf/.docx), size (<=5MB), non-empty
    B->>A: POST { fileName, fileType, fileBase64, targetRole? }
    A->>A: Zod validate request
    A->>SV: analyzeResume(input)
    alt DOCX
        SV->>PR: unzip word/document.xml, strip tags
        PR-->>SV: plain text (>=200 chars or 422)
    else PDF
        SV->>SV: verify %PDF magic bytes, attach as document part
    end
    SV->>AI: system prompt + user content (JSON mode)
    AI-->>SV: JSON text
    SV->>SV: parse JSON, validate schema, clamp scores 0-100
    SV-->>A: ResumeAnalysis
    A-->>B: { data: ResumeAnalysis }
    B->>B: render gauge / bars / cards, save to localStorage
```

## Error-handling model

```mermaid
flowchart LR
    E1["Invalid JSON body"] --> H["Route wrapper<br/>api-handler.server.ts"]
    E2["Schema validation failure"] --> H
    E3["Unreadable / oversized document"] --> H
    E4["LLM 402 / 403 / 429 / 5xx"] --> H
    E5["Network failure to provider"] --> H
    E6["Malformed AI JSON"] --> H
    H --> M["{ error: specific message, field? }<br/>mapped HTTP status"]
    M --> UI["Inline alert in the UI<br/>(role=alert), input preserved"]
```

No failure path substitutes fabricated or partial AI data.

## Deployment shape (target)

```mermaid
flowchart LR
    Dev["Developer"] -->|docker build| IMG["Container image<br/>(no secrets baked in)"]
    IMG --> REG["Container registry<br/>(e.g. Amazon ECR)"]
    REG --> RUN["Container host<br/>(AWS App Runner / ECS Fargate / Lightsail)"]
    ENV["Environment variables<br/>LOVABLE_API_KEY, PORT"] --> RUN
    User["User"] -->|HTTPS| RUN
    RUN -->|HTTPS, server-side only| LLM["LLM provider API"]
    RUN --- HC["Health check: GET /api/health"]
```
