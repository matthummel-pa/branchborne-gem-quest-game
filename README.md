# Branchborne Gem Quest

A Bejeweled / Gems of War match-3 that teaches web development. Swap glowing tech gems, ship lines of code, clear live side quests, and walk a pathway from the first HTML lesson to Senior — then class Expert raids.

The playable cabinet is this repository: open `index.html` and the board is the game. The cabinet is the standalone player brought over from [matthummel-pa/matthummel-pa](https://github.com/matthummel-pa/matthummel-pa) (`game/`).

![Key art of a cloaked archer facing an ornate cabinet of glowing web-technology gems](docs/images/hero-key-art.png)

## The cabinet

![Pathway select with Classic learning path, Frontend Mage, Backend Sentinel, WordPress Artisan, and Full-Stack Ranger](docs/images/pathway-select.png)

![Quest start for HTML bones on the 8 by 8 gem board, Full-Stack Ranger selected](docs/images/match-board.png)

![Open trophy and loot case over the gem board, with locked trophies and items](docs/images/trophies.png)

![Customize panel on the Look tab, with backdrop presets, graphics, and a custom image URL](docs/images/customize.png)

## Play locally

No install step and no build. From the repository root:

```bash
python3 -m http.server 4173
```

Open [http://127.0.0.1:4173/](http://127.0.0.1:4173/). Pick a pathway, then swap adjacent gems.

## How a match works

The board is 8×8. Click a gem, then an adjacent gem, or drag between neighbors. Three or more of the same gem in a row or column clear, the stack falls, and cascades keep writing **lines of code** (LOC). The first quest asks for 600 LOC. Hint and Shuffle are on the side when the board gets stuck. A live side quest, with a short dev tip, sits beside the board.

## Pathways

Five start cards. Classic learning path and Full-Stack Ranger both open the same full curriculum (`fullstack`) and the same power.

| Pathway | Role | Power | Lessons |
| --- | --- | --- | --- |
| Classic learning path | Intern → Senior Developer | Polyglot Pulse | 20 |
| Full-Stack Ranger | Polyglot scout | Polyglot Pulse | 20 |
| Frontend Mage | UI spellcaster | Style Nova | 18 |
| Backend Sentinel | Server guardian | Query Storm | 15 |
| WordPress Artisan | CMS craftsperson | Hook Cascade | 15 |

Gem marks are stylized teaching icons.

## Docs

- [Player guide](docs/game-guide.md) — powers, scoring, quests, trophies, controls
- [Development](docs/development.md) — layout, where the rules live, Node sanity check
- [Support](docs/support.md) — browsers, sound, reset, a board that will not start
- [Contributing](CONTRIBUTING.md)
- [Changelog](CHANGELOG.md)
