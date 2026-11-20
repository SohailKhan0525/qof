# Workspace recovery and preserved runtime

On 20 November 2026, the selected cloud workspace contained an empty Git repository. The GitHub remote returned no refs, Git had zero objects, and the prior source files and local backups were absent from `/workspace`, `/tmp` and `/home`. The published Qofeno site was still available.

The application was recovered from its actual Cloudflare deployment and public assets. No replacement payment implementation was invented. The recovery used read-only requests; it did not query database contents, change payment records, rotate secrets, or change Cloudflare settings.

## Provenance

The deployments inspected during recovery were:

| Environment | Worker | Version at recovery |
| --- | --- | --- |
| Production | `qofeno` | `ca09c46f-a08d-48ae-b426-17521778c9f1` |
| Isolated test | `qofeno-payments-test` | `3890d29d-41df-41c9-8923-c31575ede7b4` |

Cloudflare's authenticated Worker content endpoint returned the compiled modules and source maps. Source-map `sourcesContent` restored the original `server/` TypeScript and shared `src/lib/` files. The production and test deployment/configuration metadata were also archived.

The exact deployed modules are kept as:

| File | SHA-256 |
| --- | --- |
| `vendor/production-worker.mjs` | `229975fca6f15e6be4259c898eff5ed23515281afcc3d5b45df436f73678c53d` |
| `vendor/test-worker.mjs` | `202dc7ef27aff0dab856995cf167baf86a1d732f1046db02600fdcbd5d2a02a8` |

Browser JavaScript, CSS, fonts, branding and public discovery assets were recovered from `loopproof.me`. Their paths, original byte counts and hashes are recorded in [`recovered-assets.json`](recovered-assets.json). Dynamic imports were followed, including the optional ranking example. New light-theme files and artwork are additions; recovered application assets remain unchanged.

The full recovery archive is outside this repository at `/workspace/qof-recovery`. It contains original multipart responses, source maps, metadata, hashes and recovery notes. Keep that archive private. Its settings responses contain public configuration and secret **names**, not secret values.

## What was not recovered

- Original frontend React/TSX authoring files.
- The previous frontend build configuration and complete original dependency lockfile.
- Original unit/integration/browser test sources, including the prior 320-test suite.
- Database migration files, database contents, or secret values.
- Every unused historical public asset: the recovery manifest covers the published application's discovered dependency graph and explicit public identity/discovery assets.

The recovered browser bundles are functional deployment artifacts, not a substitute claim that the original frontend source tree was restored. The historical 320-test result belongs to the November 18 release and must not be reported as a test run for the new work.

## How this project now builds

`npm run build` copies `public/` into `dist/`, assembles the new authored light-theme styles from `src/styles/`, writes a content-hashed stylesheet, and adds it to the HTML shell. The existing browser application continues to own its interactions, requests and payment flow.

Wrangler uses `vendor/production-worker.mjs` or `vendor/test-worker.mjs` with `no_bundle: true` and `find_additional_modules: false`. These compiled modules retain the deployed `fetch`/`scheduled` handlers and exports. The recovered `server/` and shared `src/lib/` source files are preserved for reference and future deliberate restoration; editing those copies alone does **not** rebuild the deployed Worker in the current build pipeline.

Before a future backend change, restore a proper source build and meaningful backend tests as a separate task. Do not silently replace or loosen the byte-preservation checks to make an unverified runtime change pass.

## Configuration preservation

The configs preserve the original database UUIDs, independent visitor databases, rate-limit namespaces, canonical origins, live/test checkout separation, compatibility date/flags, production domains and cleanup cron. The test Worker must never receive the production domain routes or a live payment mode.

`npm run deploy` uses `wrangler deploy --keep-vars`. In the pinned Wrangler 4.156.2 implementation, deployments retain existing secret bindings; `--keep-vars` additionally retains existing plaintext/JSON variables. No secret values should be added to the configuration, browser assets or repository. The existing deployment holds the Dodo, owner, visitor and other previously configured secrets.

The publicly inaccessible `_headers` source could not be downloaded. Its global security policy and immutable `/assets/*` caching were reconstructed from observed live response headers. This matters because `/assets/*` is served before the Worker and does not inherit headers merely by preserving the Worker code.

## Current verification

After a build, run:

```sh
node scripts/verify-preserved-runtime.mjs
```

This offline check verifies:

- Both deployed-module hashes against the recovered originals.
- Every original public and built asset against the recovery manifest.
- Local JS/CSS/HTML asset references and theme asset references.
- Crucial Worker settings, production/test separation, database IDs, rate limits and cron.
- Restored asset security/caching headers and the variable-preserving deployment command.

The first run passed **12/12 checks**. The machine-readable result is `test-results/recovery/runtime-verification.json`. This check reads no credentials and sends no network requests.

For a deployed release, pass its exact version ID and environment:

```sh
node --use-env-proxy scripts/check-deployed-http.mjs --environment test --version <version-id>
node --use-env-proxy scripts/check-deployed-http.mjs --environment production --version <version-id>
```

The HTTP checker uses only GET requests. It verifies public and private page indexing, status/board/aggregate-visitor contracts, an empty anonymous purchase session, missing-file rejection, canonical redirects, robots/sitemaps, security headers, and deployed asset hashes. Test checkout must remain disabled; production must report live checkout availability. With the existing Cloudflare account/token environment variables, it additionally compares binding metadata and secret names to the recovery archive, checks the active version, and verifies the deployed Worker module hash. It never prints or saves credentials.

Reports are saved separately as `test-results/light-2026-11-20/deployed-http-test.json` and `deployed-http-production.json`. The test moderator request exits with 503 because no moderator key is configured. The production moderator request is deliberately omitted: even an unsuccessful GET writes a failed-sign-in rate-limit row to D1. Production authentication continuity is checked through the unchanged runtime hash. These checks do not initiate payment or recovery operations, follow advertising redirects, submit visitor heartbeats, or run database mutations.

The 20 November release passed **27/27 test HTTP checks** on version `1cd8059b-2402-4a85-bd57-44edb8550529` and **26/26 production HTTP checks** on version `6a0478c8-7f42-4a5b-8d36-321a2282766a`. Both runs verified 31 deployed assets against the stable local build, including all 27 original recovered assets. The production response reported live checkout available. Both environments retained their original bindings and secret names, and each deployed Worker module matched its original recovery hash.

Preservation checks establish artifact/configuration continuity, not new payment correctness, universal browser compatibility or a complete security audit. Validate the new presentation separately in a browser: desktop and mobile rendering, all public pages, navigation, walkthrough chapters, accessible contrast, initial HTML and purchase preview without creating an order. Deployed checks should verify real status/board responses, asset security headers and anonymous private-access rejection, while blocking financial writes and visitor-recording heartbeats. Report only the checks actually executed in the current workspace.
