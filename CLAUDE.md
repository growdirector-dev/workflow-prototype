# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
yarn dev          # Start dev server (localhost:8080)
yarn build        # Production build
yarn lint         # ESLint
yarn test         # Vitest (single run)
yarn test:watch   # Vitest (watch mode)
```

Run all three checks before finishing work: `yarn test && yarn build && yarn lint`

## Architecture

Compact workflow UI prototype. Vite 5 + React 18, JSX only (no TypeScript unless explicitly requested).

**Import alias:** `@/` → `src/`

### Directory layout

- `src/app/` — app shell (`AppLayout.jsx`), router (`router.jsx`), app-level widgets
- `src/pages/` — route-level page components (one folder per route)
- `src/widgets/` — reusable composed UI blocks (shadcn/ui components live here)
- `src/lib/` — small shared helpers (`utils.js` with `cn()`)
- `src/test/` — test setup

### Routing

Routes are registered in `src/app/router.jsx` using `react-router-dom` data router. `/` redirects to `/workflows`. Add new routes as children of the `AppLayout` route.

### Styling

Tailwind CSS 3 with design tokens defined in `src/index.css` (CSS custom properties). Use existing tokens and Tailwind utilities before adding new CSS. shadcn/ui components use `class-variance-authority`, `clsx`, and `tailwind-merge` (via `cn()` from `src/lib/utils.js`).

### Key constraints

- **Mobile-first**: every UI change must work at 360px width. Desktop sidebars need a mobile equivalent.
- **Minimal dependencies**: use the existing stack (`lucide-react`, `clsx`, `tailwind-merge`, Radix primitives) before adding new packages.
- **Small, reversible changes**: no large imports from other repos unless explicitly requested.
- **Match existing patterns**: follow current file organization, keep components shallow.

## Deploy

GitHub Actions auto-deploys `dist/` to GitHub Pages on push to `main` (`.github/workflows/deploy.yml`).
