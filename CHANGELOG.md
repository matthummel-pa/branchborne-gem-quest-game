# Changelog

## Unreleased

- Refreshed the README and player docs for the JSON save lesson. New cabinet screenshots include the Pack this quest card and the Ship your save card.
- Save opens a JSON side quest. Continue opens Ship your save: a lesson, a preview of this run, an optional 4–8 character PIN, and Open this save. The PIN is stored only as a SHA-256 hash and a salt.
- The Save screen no longer shows an email, password, signup, or magic-link form. Guest play stays in this browser.
- Ship progress as `branchborne-save.json` from the Save panel, with a JSON lesson on the player’s real save and an optional PIN stored only as a hash and salt.
- Added a GitHub landing README, player guide, development notes, support page, and contributing guide.
- Added cabinet screenshots under `docs/images/`, including the hero key art.
- Added Netlify static publish (`netlify.toml`) and `GET /api/public-config` for the public Supabase URL and publishable key.
- Persist pathway, quest, LOC, moves, phase, best score, trophies, and loot in `localStorage`. A `public.branchborne_saves` row is written only when a session is already present.
- Scoped those browser keys per guest or account, rejected non-publishable Supabase keys, and documented the threat model in `docs/security.md`.

## Imported cabinet

- Brought in the standalone Branchborne Gem Quest player from [matthummel-pa/matthummel-pa](https://github.com/matthummel-pa/matthummel-pa) (`game/`): `index.html`, `git-blocks.js`, `git-blocks.css`, and `audio/`.
