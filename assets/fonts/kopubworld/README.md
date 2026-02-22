# KoPubWorld PDF Font Assets

Place PDF-embed font files here for server-side PDF rendering.

Required for v1 screenplay PDF embedding:
- `KoPubWorldBatangMedium.woff2` (400 normal)

Optional later:
- `KoPubWorldBatangBold.woff2`
- `KoPubWorldBatangLight.woff2`

These files are read by `/api/export/pdf` on the server and inlined as `data:` URLs in `@font-face` CSS.
