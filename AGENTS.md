# Doc2CRM AI - Agent Guidelines

## Project Overview

Doc2CRM AI is a full-stack Next.js 15 application that provides AI-powered document intake for CRM systems. Users upload documents (PDF, DOCX, XLSX, images), the system extracts text locally, sends it to OpenRouter AI for parsing, and saves structured data to MongoDB.

### Tech Stack
- **Framework**: Next.js 15.1.3 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with ShadCN-style components
- **Database**: MongoDB with Mongoose ODM
- **Validation**: Zod schemas with React Hook Form
- **AI**: OpenRouter API (free tier GPT-3.5)
- **File Processing**: pdf-parse, mammoth, xlsx, tesseract.js

### Key Directories
```
src/
├── app/                    # Next.js App Router pages & API routes
│   ├── api/               # REST API endpoints
│   ├── upload/            # Document upload page
│   ├── review/[id]/      # Review & edit extracted data
│   ├── dashboard/         # Dashboard with stats
│   └── crm/              # CRM pages (leads, companies, contacts, documents)
├── components/            # React components
│   ├── ui/              # ShadCN-style UI components
│   └── navigation/      # Navigation components
├── server/               # Server-side code
│   ├── db.ts           # MongoDB connection
│   ├── models/         # Mongoose models (document, lead, company, contact, activity)
│   ├── schemas/        # Zod validation schemas
│   └── utils/          # Extraction & AI parsing utilities
├── lib/                 # Utilities (cn, format helpers)
└── types/               # TypeScript declarations
```

---

## Commands

### Development
```bash
npm run dev              # Start development server (http://localhost:3000)
```

### Build & Production
```bash
npm run build            # Build for production
npm run start            # Start production server
```

### Code Quality
```bash
npm run lint             # Run ESLint
npm run lint --fix       # Auto-fix linting issues
```

### Database
```bash
npm run db:seed          # Seed database with sample data
```

### Notes
- No test framework configured (no Jest/Vitest)
- Build must succeed before running production server
- Production mode is more stable than dev on Windows

---

## Code Style Guidelines

### Imports
- Use path aliases: `@/*` for `src/*`
- Order imports: external libs → internal → components → utils
- Example:
```typescript
import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { connectToDatabase } from "@/server/db";
import { DocumentModel } from "@/server/models";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
```

### Component File Names
- Use **lowercase** for component files: `upload-content.tsx`, `dashboard-content.tsx`
- Page files use `page.tsx` pattern
- Client components include `"use client"` directive

### TypeScript
- Always define proper types for props, state, and API responses
- Use interfaces for object shapes, types for unions/aliases
- Avoid `any`, use `unknown` when type is truly unknown
- Example:
```typescript
interface Document {
  id: string;
  originalName: string;
  fileType: string;
  extractionStatus: "pending" | "processing" | "completed" | "failed";
}
```

### Naming Conventions
- **Components**: PascalCase (`MainNav`, `DashboardContent`)
- **Files**: lowercase with hyphens (`upload-content.tsx`, `main-nav.tsx`)
- **Variables/functions**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Interfaces**: PascalCase, no "I" prefix

### Error Handling
- Use try/catch with specific error messages in API routes
- Return proper HTTP status codes (200, 400, 404, 500)
- Log errors with context for debugging
- Example:
```typescript
try {
  await connectToDatabase();
  const doc = await DocumentModel.findById(id);
  if (!doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ document: doc });
} catch (error) {
  console.error("Get document error:", error);
  return NextResponse.json(
    { error: (error as Error).message || "Failed to get document" },
    { status: 500 }
  );
}
```

### MongoDB/Mongoose
- Always call `connectToDatabase()` at the start of API routes
- Use async/await consistently
- Define schemas with proper types and defaults
- Example:
```typescript
const DocumentSchema = new Schema<DocumentType>(
  {
    originalName: { type: String, required: true },
    fileType: { type: String, required: true },
    extractionStatus: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
  },
  { timestamps: true }
);
```

### Zod Validation
- Define schemas in `src/server/schemas/`
- Use for both validation and inference
- Example:
```typescript
export const ExtractedDataSchema = z.object({
  fullName: z.string().default(""),
  email: z.string().default(""),
  phone: z.string().default(""),
  company: z.string().default(""),
  amount: z.number().nullable().default(null),
  confidence: z.number().min(0).max(1).default(0),
});

export type ExtractedData = z.infer<typeof ExtractedDataSchema>;
```

### Tailwind CSS
- Use ShadCN design tokens (from `globals.css`):
  - Colors: `primary`, `secondary`, `muted`, `destructive`, `accent`
  - Use `text-muted-foreground`, `bg-background`, etc.
- Avoid hardcoded colors when design tokens exist
- Responsive classes: `md:`, `lg:` prefixes

### React Patterns
- Use functional components with hooks
- Extract client logic to `*-content.tsx` files
- Server components in `page.tsx` for data fetching
- Example structure:
```typescript
// page.tsx (Server Component)
import { MainNav } from "@/components/navigation";
import { DashboardContent } from "./dashboard-content";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <MainNav />
      <DashboardContent />
    </div>
  );
}

// dashboard-content.tsx (Client Component)
"use client";
import { useEffect, useState } from "react";

export function DashboardContent() {
  const [data, setData] = useState(null);
  // ...
}
```

### API Routes
- Use route handlers in `app/api/*/route.ts`
- Follow REST conventions:
  - `GET` for fetching
  - `POST` for creating
  - Dynamic segments: `documents/[id]/route.ts`
- Return JSON with consistent structure

---

## Common Workflows

### Adding a New API Route
1. Create `src/app/api/[resource]/route.ts`
2. Import models and utilities
3. Implement handler functions
4. Test with curl or Postman

### Adding a New Page
1. Create directory: `src/app/[page-name]/`
2. Add `page.tsx` (server component)
3. Add `*-content.tsx` (client component if needed)
4. Update navigation in `main-nav.tsx`

### Processing a Document
1. Upload → `POST /api/upload` → saves file metadata
2. Extract → `POST /api/documents/[id]/extract` → extracts text locally
3. Parse → `POST /api/documents/[id]/parse` → sends to OpenRouter AI
4. Review → User edits in UI
5. Save → `POST /api/documents/[id]/save` → creates Lead, Company, Contact, Activity

---

## Environment Variables

Create `.env` from `.env.example`:
```env
MONGODB_URI=mongodb://localhost:27017/doc2crm-ai
OPENROUTER_API_KEY=your-openrouter-api-key-here
OPENROUTER_MODEL=openai/gpt-3.5-turbo
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Known Issues

- Windows: Use `npm run build && npm run start` instead of dev server to avoid webpack cache issues
- ESLint warnings about useEffect dependencies are informational, not blocking
- Ensure MongoDB is running before starting the app
