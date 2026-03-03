# Codebase Structure Review

This document provides a quick architectural review of the WhatsApp Chat Analyzer single-page app and maps key responsibilities to the current source layout.

## 1) High-level architecture

The app follows a **feature-oriented SPA structure** with clear separation between:

- **Route/page orchestration** (`src/pages/*`)
- **Composable view components** (`src/components/*`)
- **Domain and integration logic** (`src/lib/*`)
- **Reusable UI primitives** (`src/components/ui/*`)
- **Cross-cutting hooks** (`src/hooks/*`)

This is a good baseline for a Vite + React + TypeScript app, especially for single-route products that still need maintainability.

## 2) Directory map and responsibilities

```text
src/
├── assets/                  # Static media bundled by Vite
├── components/              # Feature components (upload, dashboard, AI chat)
│   └── ui/                  # shadcn/ui primitives and wrappers
├── hooks/                   # Reusable React hooks
├── lib/                     # Parsing, analytics, AI integration, utils
├── pages/                   # Route-level pages (Index, NotFound)
├── App.tsx                  # App shell + routes/providers
└── main.tsx                 # React bootstrap
```

### Key ownership by file

- `src/pages/Index.tsx`: state machine for upload/loading/error/dashboard + tab switching between analytics and AI.
- `src/components/UploadZone.tsx`: drag-drop and file-loading UX.
- `src/lib/whatsapp-parser.ts`: regex parsing and computed chat statistics.
- `src/components/Charts.tsx` + `SummaryCards.tsx` + `BehaviorCards.tsx` + `VibeCheckCard.tsx`: analytics rendering.
- `src/components/AIChat.tsx` + `src/lib/gemini-ai.ts`: Gemini prompt/context and chat UI.

## 3) Runtime data flow

1. User uploads exported WhatsApp `.txt` in `UploadZone`.
2. `Index` receives file text and delegates parsing to `parseWhatsAppChat`.
3. Parsed `ParsedMessage[]` is memoized into `ChatStats` via `computeStats`.
4. Dashboard components receive normalized stats/messages as props.
5. AI chat consumes the same parsed context to answer analysis questions.

## 4) Strengths

- **Reasonable layering**: parsing and AI integrations are kept in `lib/`, UI in components.
- **Reusable UI system**: `components/ui` avoids repeating low-level controls.
- **Single source of truth**: parsed messages and stats are centralized in `Index` and propagated downward.
- **Simple state transitions**: upload → loading → dashboard/error are explicit and easy to follow.

## 5) Structural recommendations

1. **Reduce page-level weight in `Index.tsx`**
   - Move inline `ApiKeyModal` to `src/components/ApiKeyModal.tsx`.
   - Consider splitting dashboard sections into a dedicated `AnalyticsDashboard` component.

2. **Formalize feature folders (optional next step)**
   - Example: `src/features/upload`, `src/features/analytics`, `src/features/ai-chat`.
   - This helps when each feature grows to multiple files/services/hooks.

3. **Create explicit domain types module**
   - Extract shared types (`ParsedMessage`, `ChatStats`) into `src/lib/types.ts` to prevent coupling to parser implementation details.

4. **Move cloud-upload concern out of page component**
   - `uploadChatArchive` can live in `src/lib/archive-storage.ts` to isolate side effects and simplify testing.

5. **Improve test topology**
   - Keep parser/integration tests near domain code (e.g., `src/lib/__tests__/whatsapp-parser.test.ts`).
   - Keep component tests near components where practical.

## 6) Current risk hotspots

- `src/pages/Index.tsx` has become a broad integration point (uploading, parsing orchestration, modal state, tab rendering).
- AI prompt/context assembly can grow quickly; keep it isolated and unit-tested as chat features expand.
- Parser regex maintenance will become critical if supporting more WhatsApp export locales/formats.

## 7) Suggested next incremental refactor

A low-risk next step is to:

- Extract `ApiKeyModal` and `uploadChatArchive` out of `Index.tsx`.
- Keep behavior the same while shrinking page complexity.
- Add parser fixture tests for common export variants.

This improves readability and maintainability without changing product behavior.
