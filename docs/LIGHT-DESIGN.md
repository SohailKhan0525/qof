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

## Previous field guide and editorial gallery

[Uizze's public workflow guide](https://uizze.com/guides/ui-reference-workflow) recommends choosing references for a specific design decision. Qofeno used the public [Are.na](https://uizze.com/design/are-na), [A24](https://uizze.com/design/a24) and [Aardvark Book Club](https://uizze.com/design/aardvark-book-club) examples to study how products show their actual collections early. The homepage now previews real editorial picks in its artwork and links directly to the gallery. The gallery's covers distinguish each destination and its title, category and save action remain in HTML. The reference library and guides were sufficient for this work.

`src/illustrations/open-web-art.mjs` draws the hero, six discovery covers and closing artwork with Canvas 2D. `src/illustrations/mount-art.mjs` mounts decorative canvases onto the existing client, repaints at layout size changes and caps rendering at 2× pixel density. The original static hero art and gallery initials provide fallback visuals. The former gallery stylesheet was retired when the site switched to a single website board.

The placement guide, board examples, checkout illustration, visitor scene, walkthrough globe, FAQ, and illustrations on support, policy and account screens share the same paper artwork style. `placement-art.mjs` and `utility-art.mjs` draw these scenes as Canvas 2D paths and text. The painters take a normalized progress value so strokes and fills can build individually. `mount-art.mjs` runs a shared frame loop while illustrations are in view, pauses when they leave, and stops drawing once they finish. ResizeObserver keeps the bitmap aligned with its frame. A browser without Canvas 2D displays the static artwork.

`src/styles/top-navigation.css` gives the sticky header a stable height and aligns its background with its controls. Short menu layouts keep the main links and placement action reachable in landscape.

Run `node scripts/check-canvas-art.mjs` against a local Worker or set `QOFENO_CHECK_URL` to the deployed origin. This check compares rendered frames, verifies the offscreen pause, and covers the layout from 320px through desktop, checkout preview and the fallback. Browser checks block API writes.

## Typography and alignment

Boardy’s public homepage uses Raleway for its display headings and keeps the reading measure narrow. Uizze uses Figtree to keep its interface and supporting copy readable. Qofeno uses Raleway for the hero and section headings, Figtree for body text and controls, and Newsreader for the editorial cards. Raleway and Figtree are self-hosted under their SIL Open Font Licenses in `docs/`.

`src/styles/type-and-layout.css` defines the type roles and the shared content grid. The header frame, hero, tour, board, gallery, activity, process, FAQ and footer align to the same gutters. Section spacing and action sizes scale with the viewport. The original Canvas illustration remains the main visual.

References: https://www.boardy.ai/ and https://uizze.com/.

The desktop and mobile screenshots were exported in Shots using its Safari Light frame. The original PNG exports are in `public/brand/mockups/`.

## Board-first layout

The current homepage opens with a more compact two-column hero and puts the website board immediately below it. The Canvas headpiece illustrates the operator’s Qofeno placement. The board labels `loopproof.me` as an active owner placement and keeps it outside paid spend, rank and expiry calculations. The title and section hierarchy use Raleway and the interface uses Figtree. The previous discovery gallery and walkthrough are retired, including their menu and footer links, initial HTML, and RSS feed.

## Owner placement artwork

The owner placement renders a small stack of paper plaques with the Qofeno mark in relief. A restrained angle and soft shadows make the layers readable, inspired by the single-object framing on [Apple’s AirTag page](https://www.apple.com/airtag/) and the material closeups on [Vitsœ’s 606 page](https://www.vitsoe.com/us/606). The geometry comes from the existing brand mark and the paper details are drawn locally.

The Three.js bundle loads near the placement. It renders on demand, pauses offscreen, and responds to pointer movement with a small tilt. Reduced motion shows the scene at rest. The original badge fills the same space when WebGL2 is unavailable, the bundle fails to load, or the browser signals Save-Data. The implementation follows Three.js’s [on-demand rendering](https://threejs.org/manual/#en/rendering-on-demand) and [resource cleanup](https://threejs.org/manual/#en/cleanup) guides.

Run `node scripts/check-placement-sculpture.mjs` to check load timing, pointer response, layout and fallback in Chromium. Set `QOFENO_CHECK_URL` to target a deployed site. The check blocks API writes.
