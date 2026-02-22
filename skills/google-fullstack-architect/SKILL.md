---
name: google-fullstack-architect
description: Produce Google-style technical design documents for fullstack web applications before implementation. Use when users ask for system architecture, stack selection rationale, folder structures, database schema design, API contracts, auth/authorization design, frontend state strategy, third-party integrations, environment configuration, performance targets, architecture diagrams, and sprint-by-sprint roadmap plans.
---

# Google Fullstack Architect

Generate architecture first, then implementation guidance.

## Output Contract

Always return these sections in order:

1. Problem framing and assumptions
2. Technical stack recommendation with rationale
3. End-to-end architecture diagram explanation
4. Application folder and directory structure
5. Database schema design (tables, relations, indexes)
6. API endpoint specification (path/method/request/response/error)
7. Authentication and authorization model
8. Frontend state management and data flow pattern
9. Third-party integration strategy (payments/email/storage/analytics)
10. Environment setup (`dev`, `staging`, `prod`) and env vars
11. Performance SLOs and benchmark targets
12. Sprint roadmap (weekly, MVP -> production)
13. Risks, trade-offs, and mitigation plan

Use concise but implementation-ready detail.

## Style Rules (Google-style TDD)

- Write with clear constraints and measurable targets.
- Separate functional requirements and non-functional requirements.
- State trade-offs explicitly when choosing tools.
- Prefer stable, well-supported technologies over novelty.
- Provide schema and API examples in exact, copyable format.

## Stack Recommendation Heuristics

- Frontend default: Next.js + TypeScript + Tailwind.
- Backend default: Node.js (NestJS or Next route handlers) with typed contracts.
- Database default: PostgreSQL (transactional core), Redis (cache/session queue).
- Hosting default: Vercel (web), managed Postgres, managed Redis, object storage.
- Observability default: structured logs + metrics + tracing.

If the user already has constraints, optimize within those constraints.

## Architecture Diagram Guidance

When diagrams are requested, describe at minimum:

- Client layer (web/mobile)
- Edge/CDN and app runtime
- API service boundaries
- DB/cache/object storage
- External integrations
- Async workers/queues (if needed)
- Security boundaries (auth, secrets, private network)

## API Spec Requirements

For every endpoint include:

- Method + path
- Request headers/body/query/path params
- Response success shape
- Error codes and error response shape
- Authorization requirement

Prefer explicit JSON examples.

## Database Spec Requirements

For each table include:

- Purpose
- Columns with types and nullability
- PK/FK
- Required indexes and uniqueness constraints
- Hot query patterns the indexes support

## Roadmap Rules

- Break into 1-week sprints.
- Each sprint must include deliverables and validation criteria.
- Start with MVP path, then hardening, then scale/readiness.

## References

Load these as needed:

- `references/tdd-template.md` for section template and acceptance checklist.
- `references/integration-options.md` for provider selection options and trade-offs.

