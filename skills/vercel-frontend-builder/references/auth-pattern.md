# Auth Pattern Reference

Use this when requests include login/signup/reset/profile flows.

## Required routes

- `/login`
- `/signup`
- `/forgot-password`
- `/reset-password`
- `/profile`

## Validation baseline

- Email format check
- Password min length + character policy
- Password confirmation matching
- Human-readable inline errors

## Session UX

- Protect private routes with layout guard.
- Redirect unauthenticated users to `/login`.
- Preserve intended destination for post-login redirect.

