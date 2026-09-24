# Contributing

Issues and pull requests go to [matthummel-pa/branchborne-gem-quest-game](https://github.com/matthummel-pa/branchborne-gem-quest-game).

## Play the change

From the repository root:

```bash
python3 -m http.server 4173
```

Open [http://127.0.0.1:4173/](http://127.0.0.1:4173/) and walk the screen you touched: pathway select, a swap, Hint, Shuffle, Trophies, and Customize.

## Where to edit

The cabinet is vanilla HTML, CSS, and one IIFE. Keep it that way: no bundler and no new package step for a content or rules change.

- Player-facing rules, lessons, pathways, trophies, and scoring live in `git-blocks.js`. See [Development](docs/development.md) for the constants and a Node require you can run after an engine edit.
- After a save-shape change, run `node scripts/verify-progress.js`.
- After a security-sensitive change, run `node scripts/security-check.js`.
- The shell in `index.html` and the theme in `git-blocks.css` should stay in step with the selectors the script expects (`data-git-blocks`, `data-board`, `data-hint`, and the rest).

## Docs

Player behavior goes in [docs/game-guide.md](docs/game-guide.md). Setup and engine notes go in [docs/development.md](docs/development.md). Browser and save issues go in [docs/support.md](docs/support.md). Update the root [README](README.md) when the play command or the pathway list changes.

Screenshots in `docs/images/` are captures of this cabinet (plus the hero key art). Replace a gameplay shot by serving the cabinet and capturing it. Do not substitute a mock.

## Reports

Use GitHub issues. Name the browser, the pathway, and the quest or raid. This project does not publish a support email.
