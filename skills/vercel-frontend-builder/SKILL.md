---
name: vercel-frontend-builder
description: Build production-ready React frontend implementations with TypeScript and Tailwind CSS, including component architecture trees, responsive layouts, navigation/routing, form validation UX, state management boundaries, API integration patterns, auth UI, theme/dark mode tokens, accessibility requirements, and performance optimization. Use when users ask for complete frontend app structures or full file-by-file implementation output.
---

# Vercel Frontend Builder

Follow this workflow when generating frontend solutions.

## Output Contract

Always produce these sections in order:

1. Component architecture tree
2. Responsive layout plan (mobile/tablet/desktop)
3. Navigation and routing map
4. State model (`global`, `local`, `server`)
5. API integration layer (loading/error/success handling)
6. Form specs (validation rules + error/success states)
7. Auth UI flow (login/signup/reset/profile)
8. Theme/design token system (including dark mode)
9. Accessibility checklist (keyboard, ARIA, screen reader)
10. Performance plan (lazy loading, code splitting, image/cache)
11. Full implementation files (TypeScript + Tailwind)

If the user asks for code directly, still include a short architecture tree before files.

## Tech Defaults

- Framework: React + TypeScript
- Styling: Tailwind CSS
- UI primitives: reusable component library pattern (`components/ui/*`)
- Forms: `react-hook-form` + schema validation
- Server state: React Query pattern
- Routing: nested route structure with layout boundaries
- Auth pages: login, signup, reset password, profile

If the user specifies a stack, follow that stack and keep the same output contract.

## Implementation Rules

- Generate production-oriented code, not pseudo-code.
- Separate concerns:
  - `app/routes/layout` for navigation shells
  - `features/*` for domain modules
  - `components/ui/*` for shared primitives
  - `lib/api/*` for API client + endpoint wrappers
  - `lib/state/*` for global state
- Show explicit loading/error/empty states for every async view.
- Forms must define validation rules and user-facing error messages.
- Include ARIA labels and keyboard-friendly interactions for custom controls.
- Do not omit files that are required for the app to run.

## Quality Gates

Before final answer, verify:

- Every routed page appears in the navigation map.
- Every form has validation + error UI + submit success state.
- Every API call path has loading and error handling.
- Dark mode tokens are defined and consumed consistently.
- No inaccessible icon-only controls without labels.
- No single oversized component when feature split is obvious.

## Variants

Use targeted references based on user request:

- Dashboard/admin or multi-panel applications: read `references/dashboard-pattern.md`.
- Auth-heavy apps: read `references/auth-pattern.md`.

