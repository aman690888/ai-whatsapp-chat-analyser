# Codebase Structure Review

This review summarizes the current architecture of the WhatsApp Chat Analyzer SPA and highlights what is working well, where complexity is accumulating, and what to refactor next.

## 1) Repository at a glance

```text
.
├── public/                     # Static files (favicon, robots, placeholder)
├── src/
│   ├── assets/                 # Bundled image assets
│   ├── components/             # Feature-level React components
│   │   └── ui/                 # Shared shadcn/ui primitives
│   ├── hooks/                  # Reusable hooks (mobile, toast)
│   ├── lib/                    # Domain logic + external integrations
│   ├── pages/                  # Route-level pages
│   ├── test/                   # Vitest setup + test examples
│   ├── App.tsx                 # Providers + router map
│   └── main.tsx                # App bootstrap
├── README.md
└── project config files        # Vite, Tailwind, TS, ESLint, Vitest
```

## 2) Architectural layering (current state)

The application follows a mostly clean layered shape:

- **Presentation/route layer**
  - `src/pages/Index.tsx` orchestrates upload state, parsing, dashboard rendering, tab state, and API key modal logic.
  - `src/pages/NotFound.tsx` handles catch-all route behavior.
- **Feature component layer**
  - Upload and dashboard widgets are composed through `src/components/*`.
  - AI UX is encapsulated in `src/components/AIChat.tsx`.
- **Domain/integration layer**
  - Parsing and analytics: `src/lib/whatsapp-parser.ts`.
  - LLM integration + key persistence: `src/lib/gemini-ai.ts`.
  - Persistence integration: `src/lib/supabase.ts`.
- **Design system layer**
  - `src/components/ui/*` provides primitive UI building blocks.

This is a strong baseline for maintainability in a single-route product.

## 3) Runtime data flow

1. `UploadZone` reads a WhatsApp `.txt` file and forwards `text + file metadata` to the page container.
2. `Index` transitions through `upload -> loading -> dashboard|error` states.
3. `parseWhatsAppChat` converts the export into `ParsedMessage[]`.
4. `computeStats` derives analytics structures (`messagesByUser`, `messagesByDate`, behavioral metrics, emoji stats, etc.).
5. Analytics components render cards/charts from computed stats.
6. `AIChat` sends user questions and chat-derived context through `askGemini` using model `gemini-2.5-flash`.

## 4) What is working well

- **Clear library boundaries** between UI and parser/AI business logic.
- **Reusable chart/cards composition** keeps analytics rendering modular.
- **Client-only key persistence** in `localStorage` aligns with no-backend LLM usage.
- **Extensible stats model** already includes behavioral signals (conversation starters, double-texter, media/link sharer).

## 5) Structural hotspots to address

1. **`Index.tsx` is an orchestration bottleneck**
   - It currently owns upload handling, Supabase upload side effects, parser invocation, view state machine, and part of API key settings UX.
2. **API key settings are duplicated conceptually**
   - API key modal/settings concerns appear across multiple UI surfaces instead of one canonical settings flow.
3. **Feature boundaries are implicit, not explicit**
   - Components are grouped by type (`components/`) rather than feature domain, which will become harder to navigate as the app grows.
4. **Integration concerns are mixed into page logic**
   - Upload-to-storage behavior is embedded in `Index.tsx` instead of a dedicated service module.

## 6) Recommended near-term refactor plan (low risk)

### Phase 1: Extract without behavior change

- Move upload side effects into `src/lib/archive-storage.ts`.
- Extract API key modal/settings UI into a shared component.
- Keep `Index.tsx` focused on view state + composition.

### Phase 2: Introduce feature folders

Suggested target shape:

```text
src/features/
├── upload/
│   ├── components/
│   ├── hooks/
│   └── services/
├── analytics/
│   ├── components/
│   └── selectors/
└── ai-chat/
    ├── components/
    ├── prompts/
    └── services/
```

This can be done incrementally while preserving existing imports.

### Phase 3: Testing topology improvements

- Add parser fixture tests for multiple WhatsApp export formats/locales.
- Add integration tests for AI prompt/context assembly.
- Add smoke tests for `Index` state transitions (upload success/error).

## 7) Overall assessment

The codebase is in a solid, understandable state for a Lovable-generated Vite SPA that evolved into a real product. The main architectural risk is **concentration of responsibilities in `Index.tsx`** and mild **duplication in API key/settings orchestration**. A small extraction pass would significantly improve long-term maintainability without changing user-visible behavior.
