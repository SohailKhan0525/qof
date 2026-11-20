# Qofeno

Qofeno is an independent website directory at https://loopproof.me, with editorial discoveries and clearly separate, one-time paid placements.

## Run locally

```sh
npm ci
npm run dev
```

The local Worker serves at http://localhost:8787 with checkout disabled. Local D1 databases start empty; public-data browser fixtures are provided for presentation checks. The production and test databases must never be bound remotely to local development.

## Build and verify

```sh
npm run build
node scripts/verify-preserved-runtime.mjs
node scripts/check-light-design.mjs
node scripts/check-paid-board.mjs
node scripts/check-light-functional.mjs
```

Browser checks use `/usr/bin/chromium`. If rebuilding while Wrangler is running, restart it before checking a newly hashed asset: its local asset manifest can retain the previous build. Tests intercept only local public API reads and block API writes; fixture content is never published. Remote interaction checks accept `QOFENO_CHECK_URL` and default to the isolated test Worker.

## Deploy

```sh
npm run build
node scripts/verify-preserved-runtime.mjs
npx wrangler deploy --config wrangler.payments-test.jsonc --keep-vars
# Verify the isolated deployment before production:
npm run deploy
```

Cloudflare credentials belong in secure environment settings. Existing Worker secrets remain in Cloudflare; do not put them in this repository. No Dodo products, payment records or database schema were changed for the light redesign.

## Source recovery

This workspace was restored from the published application on 20 November 2026. Original server/shared TypeScript was recovered. The original frontend TSX and old test suite were unavailable. The published browser app and Worker modules are preserved byte-for-byte; the new authored styles, illustration and accessibility adapter are separate. See [recovery notes](docs/RECOVERY.md) before modifying backend source, and [design notes](docs/LIGHT-DESIGN.md) for this release.
