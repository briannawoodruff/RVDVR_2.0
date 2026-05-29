## Add RVDΛR logo as browser favicon

1. Copy the uploaded `RVDVR-Icons-Logo.svg` to `public/favicon.svg`.
2. In `src/routes/__root.tsx`, add favicon links to the root route's `head().links` array:
   - `{ rel: "icon", type: "image/svg+xml", href: "/favicon.svg" }`
   - Keep it sitewide so every route inherits it.
3. If an old `public/favicon.ico` exists, leave it as a fallback (browsers prefer the SVG when both are listed).

No other files change.
