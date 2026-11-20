# Qofeno: a light editorial identity

The reference was Tobi's public [nine-design montage](https://x.com/tobiadonadon_/status/2123517815324111060), published on 19 November 2026. The available ten-second video was reviewed at multiple frames. It shows nine hero treatments, not full sites or their complete interactions. The useful commonality is a clear visual subject and individual typography: editorial red type, scenic photography, restrained financial typography, yellow studio art direction, and other distinct compositions. No design code, image or video from the reference is used in Qofeno.

Qofeno's subject is the independent web. Its new visual language uses paper-white surfaces, navy ink, blue links, Newsreader display typography and DM Sans controls. The new hero is an original illustrated web index. The former neon flower/orbit imagery and dark backgrounds are replaced throughout navigation, product walkthrough, board, editorial collection, process illustrations, activity, purchase/recovery screens, policies and footer. Paid listing color choices still belong to their owners.

The existing GSAP interaction logic remains: mobile menu transitions, scroll entrances, finite three-chapter walkthrough and illustrated process motions. The index illustration gets a brief entrance, not an endless loop. The walkthrough's fictional examples remain labeled and separate from actual listings.

The presentation adapter fixes an existing visitor-counter accessibility defect: native definition descriptions cannot be named using aria-label. It exposes the same supplied labels as hidden text while preserving the definition structure, visible counters and React-owned values. It does not send requests or collect data.

## Implementation

- `src/styles/light-foundation.css`: global identity, navigation and public homepage sections.
- `src/styles/light-functional.css`: purchase/account/policy/detail/activity states.
- `public/brand/web-index.svg`: original paper index illustration.
- `public/assets/qofeno-accessibility.js`: scoped visitor description adapter, content-hashed at build time.
- `scripts/build.mjs`: clean static build, hashed new assets, exact preserved application bundles.

Newsreader is self-hosted under the SIL Open Font License; see `Newsreader-OFL.txt`. Design review used the Unslop skill by Damir Sokolovsky (@heydamir), licensed CC BY 4.0. The interface and illustration were authored for Qofeno; no reference-site source was extracted.

## Verification scope

Desktop 1440px and mobile 390px/320px are checked with a dark device preference to confirm the site stays light. Checks cover horizontal overflow, accessibility, menu focus, walkthrough scene/rank progression, editorial search, ranking preview, purchase dialog, legal/account/owner pages, active and missing listing states, and visitor-counter states. API writes and heartbeats are blocked in browser checks. No real purchase is created by the checks.

The original backend and client hashes are independently verified. Read-only deployed checks inspect public responses, asset security headers, search metadata, anonymous private-access rejection and production/test configuration isolation. Results are stored under `test-results/` while running; this is not a claim of a new penetration test, a load test or re-running the unavailable historical suite.
