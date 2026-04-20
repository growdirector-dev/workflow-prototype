# AGENTS.md

## Goal
- Keep this repo a compact workflow UI prototype.
- Prefer small, reversible changes. Do not import large chunks from other repos unless explicitly requested.

## Stack
- Vite 5 + React 18.
- `react-router-dom` data router for app navigation.
- Tailwind CSS 3 with tokens in `src/index.css`.
- Existing utility stack first: `lucide-react`, `clsx`, `tailwind-merge`.
- Testing: Vitest + Testing Library.

## Project Shape
- `src/app` — app shell and router.
- `src/pages` — route-level pages only.
- `src/widgets` — reusable composed UI blocks.
- `src/lib` — small shared helpers only.
- Current codebase is `js/jsx`; do not introduce TypeScript unless explicitly requested.

## UI Rules
- Reuse existing design tokens and Tailwind utilities before adding new CSS.
- Keep components focused and shallow; avoid premature abstractions.
- Use the current visual direction from the migrated workflow shell, not generic default UI.
- Do not add new dependencies if the current stack already covers the task.

## Mobile
- Mobile view is required for every UI change.
- Do not ship desktop-only layouts.
- Check layouts at narrow widths too; target at least ~360px wide screens.
- If a desktop sidebar is added or changed, provide a mobile behavior as well (stacked layout, drawer, or equivalent).

## Routing
- Register routes in `src/app/router.jsx`.
- Keep `/` as a redirect entry when that matches the app flow.
- Prefer route pages over conditional rendering inside `App.jsx`.

## Verification
- Before finishing, run the relevant checks:
- `yarn test`
- `yarn build`
- `yarn lint`

## Editing Notes
- Preserve DRY/KISS/YAGNI.
- Match the existing file organization instead of inventing a new architecture.
- Update tests when route structure or visible page copy changes.
