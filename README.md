# Halal Food Checker

Phase 1 implementation of a halal checking web app using local keyword matching.

## Phase 1 scope

This phase is intentionally simple and frontend-only:

- No backend/API routes
- No database
- No OCR
- One input field for food/product text
- Immediate local classification result on submit

## Current logic (Phase 1)

Input is classified by checking for haram-related keywords.

- If the text contains any haram keyword, status is `non_halal`
- If no haram keyword is found, status is `halal`
- If input is empty, status is `unknown`

Current haram keyword list:

- `pork`
- `babi`
- `khinzir`
- `lard`
- `arak`
- `wine`
- `beer`
- `rum`
- `vodka`
- `ham`
- `bacon`

## UI and theme

The app UI is built with Material UI and includes:

- Card-based page layout
- Text field input and action button
- Result panel with status chip and reasons list
- Mandatory disclaimer section

Global MUI theme is configured in `src/theme.ts`:

- Primary: `#2AAA8A`
- Secondary: `#C1E1C1`

Theme is applied app-wide in `src/pages/_app.tsx` with `ThemeProvider` and `CssBaseline`.

## Project structure (Phase 1)

- `src/pages/index.tsx` - main halal checker page and local classification logic
- `src/pages/_app.tsx` - global app wrapper with MUI theme provider
- `src/theme.ts` - Material UI theme configuration
- `src/lib/types.ts` - shared TypeScript types

## Mandatory disclaimer

The app displays this notice to avoid claiming certification:

> This result is generated based on available data and ingredient analysis. It is not a certified halal verification. Please refer to official authorities for confirmation.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Quick test cases

- `Ayam Goreng KFC` -> expected: `halal`
- `Burger babi` -> expected: `non_halal`
- `Chicken with wine sauce` -> expected: `non_halal`
- empty input -> expected: `unknown`

## Tech stack

- Next.js (Pages Router)
- React
- TypeScript
- Material UI

## Next phase ideas

- Add backend API routes
- Add product/source verification flow
- Add OCR image input
- Add richer rules and confidence scoring
# halaal_my
