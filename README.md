# WhatsApp Chat Analyzer (ChatLens)

Single-page React app that parses exported WhatsApp chats (`.txt`), computes analytics, and answers questions about the chat using Gemini.

## Tech Stack

- Vite + React + TypeScript
- Tailwind CSS + shadcn/ui primitives
- Recharts for data visualization
- Lucide React icons
- Gemini REST API (`gemini-2.5-flash`)

## Codebase Structure Review

```text
.
├── src/
│   ├── assets/                # Static assets (hero background)
│   ├── components/
│   │   ├── AIChat.tsx         # Gemini chat UI + API key modal/state
│   │   ├── Charts.tsx         # Recharts visualizations
│   │   ├── SummaryCards.tsx   # KPI cards (messages, participants, etc.)
│   │   ├── UploadZone.tsx     # Drag-and-drop / file input surface
│   │   └── ui/                # shadcn/ui component primitives
│   ├── hooks/                 # Shared hooks (toast/mobile)
│   ├── lib/
│   │   ├── whatsapp-parser.ts # Chat parsing + analytics aggregation
│   │   ├── gemini-ai.ts       # Gemini request and context construction
│   │   ├── mock-ai.ts         # Mock AI fallback helper
│   │   └── utils.ts           # Utility helpers
│   ├── pages/
│   │   ├── Index.tsx          # Main app state machine (upload/loading/dashboard)
│   │   └── NotFound.tsx       # Router fallback page
│   ├── App.tsx                # Providers + routes
│   └── main.tsx               # React entry point
├── public/                    # Static public files
├── src/test/                  # Vitest setup and example test
└── config files               # Vite, Tailwind, ESLint, TS, Vitest
```

## Runtime Flow

1. `UploadZone` accepts a WhatsApp-exported `.txt` file and reads it with `FileReader`.
2. `Index` invokes `parseWhatsAppChat` and stores normalized `ParsedMessage[]`.
3. `computeStats` derives participant/message/date/month aggregates used in cards/charts.
4. Analytics tab renders KPI cards + charts from the computed stats.
5. AI tab sends user questions plus full chat context to Gemini and renders responses.

## Notable Design Choices

- Parsing is regex-based and supports common WhatsApp date/time variants.
- Multi-line messages are reconstructed by appending non-header lines to the prior message.
- Some known system-message patterns are filtered before analytics.
- Gemini API keys are stored in `localStorage` and only used client-side.

## Local Development

```sh
npm install
npm run dev
```

## Quality Checks

```sh
npm run lint
npm run test
npm run build
```
