# Dashboard Pattern Reference

Use this when the request is dashboard/admin centered.

## Suggested feature slices

- `features/overview`
- `features/analytics`
- `features/users`
- `features/settings`

## Layout baseline

- Left sidebar navigation
- Sticky top header with search/actions
- Content area with responsive grid cards
- Mobile: collapsible drawer nav + stacked cards

## Data UX rules

- Use skeleton loading for card grids.
- Use retry CTA for recoverable failures.
- Surface empty states with primary CTA.

