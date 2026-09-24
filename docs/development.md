# Development

The cabinet is a static page. There is no package manifest, bundler, or committed test runner. `git-blocks.js` is a vanilla IIFE: in the browser it assigns `GitBlocks` and `Branchborne` on the global object, and in Node it assigns `module.exports`.

## Repo layout

```
index.html          Cabinet shell: title, stats, buttons, customize form
git-blocks.js       Rules, curriculum, pathways, canvas, audio, and UI boot
git-blocks.css      Layout and theme
audio/              stack-sprint.ogg and stack-sprint.wav
docs/               Player guide, this note, support, screenshots
```

`index.html` loads the stylesheet and script with relative URLs and marks the player with `data-git-blocks`. On `DOMContentLoaded`, `boot` attaches to every element with that attribute.

## Run the cabinet

From the repository root:

```bash
python3 -m http.server 4173
```

Open [http://127.0.0.1:4173/](http://127.0.0.1:4173/). Serve the root so `./git-blocks.js`, `./git-blocks.css`, and `audio/stack-sprint.ogg` resolve. The theme file is chosen in `resolveGameAsset`.

## Change the page or the engine

| Change | Where |
| --- | --- |
| Headings, stat labels, the Pause / Sound / Customize buttons, customize fields | `index.html` |
| Colors, class cards, trophy case, quest rail, layout | `git-blocks.css` |
| Match size, scoring, moves, lessons, pathways, trophies, drawing, sound | `git-blocks.js` |
| Theme song | `audio/stack-sprint.ogg` (a `.wav` copy sits beside it) |

The script paints several surfaces that are not in the HTML: the pathway cards, the mana bar and **Cast** button, the quest rail contents, and the trophy dialog. Edit those in `git-blocks.js` (`renderClassSelect`, `paintMana`, `paintQuestRail`, `paintTrophyBoard`).

`window.GitBlocksConfig` is optional. `shareUrl` overrides the link builder, and `autoStart: true` calls play when status is already `ready`. The checked-in page does not set that flag; a run starts when a pathway card is clicked.

## Lines of code, curriculum, and pathways

These all live in `git-blocks.js`.

- **Board.** `SIZE`, `COLS`, and `ROWS` are 8. `MATCH_MIN` is 3. `GEMS` is the logo set. `findMatches` scans rows and columns. `trySwap` rejects a swap that does not create a match and does not spend a move.
- **Lines of code.** `scoreMatch(cellCount, chain, level, affinityHits)` is the LOC for one wave: `cellCount * 28`, times a chain bonus, a level bonus, and a small affinity bonus. `applyWaves` adds that to `state.linesOfCode` (also exposed as `score`) and to `levelScore`, which is what the quest bar uses. Query Storm sets `locMultiplier` to 2 for the next wave, then clears it. Polyglot Pulse adds `Math.max(120, combo * 90 + 180)` directly.
- **Goals and moves.** `goalForLevel` is `600 + (level - 1) * 350` on the learning path. Raid goals and move budgets are the `goal` and `moves` fields on each `ENDGAME_CHALLENGES` entry. `movesForLevel` on the path is `Math.max(28, 48 - min(10, level - 1))`. The subtraction stops at 10, so the opening bank goes 48, 47, … and levels off at 38. The `28` floor is in the formula and is not reached by that countdown.
- **Curriculum.** `CURRICULUM` is the 20 lessons. Each entry has `id`, `title`, `track`, `rank`, `skill`, `clouds`, and `facts`. `grantLessonSkill` records the skill the first time that lesson is entered.
- **Pathways.** `PATHWAY_CLASSES` is Frontend Mage (`frontend`), Backend Sentinel (`backend`), WordPress Artisan (`wordpress`), and Full-Stack Ranger (`fullstack`). Each has `affinity`, `lessonIds`, backdrop, and `power`. Full-Stack Ranger's `lessonIds` is every curriculum id. The **Classic learning path** card is not a fifth engine pathway: its click handler calls `choosePathway("fullstack")`.
- **Collection.** `TROPHIES` and `LOOT_ITEMS` are catalogs with `test(state)` predicates. `ACHIEVEMENTS` feeds the badge row the same way.
- **Saved data.** `STORAGE.high` is `git-blocks-high-score`. `STORAGE.prefs` is `git-blocks-prefs-v2`. The quest run itself is in the `createGame` closure and is not written to storage.

## Sanity-check from Node

Require the script. It does not touch `document` until `boot`, and the bottom of the file only calls `boot` when `document` exists.

```bash
node -e '
const gb = require("./git-blocks.js");
const game = gb.createGame({ random: () => 0.37, pathwayId: "frontend" });
game.choosePathway("frontend");
game.play();
const snap = game.snapshot();
console.log(gb.GAME_TITLE, gb.SIZE + "x" + gb.SIZE, "match", gb.MATCH_MIN);
console.log(snap.status, snap.lessonTitle, snap.goal, "LOC /", snap.moves, "moves");
console.log(gb.PATHWAY_CLASSES.map((p) => p.name + " (" + p.lessonIds.length + ")").join(", "));
'
```

That prints the title, an 8×8 board with match length 3, a playing snapshot on HTML bones at 600 LOC and 48 moves, and the four pathway lesson counts (18, 15, 15, 20).

Useful exports include `createGame`, `CURRICULUM`, `PATHWAY_CLASSES`, `TROPHIES`, `LOOT_ITEMS`, `ENDGAME_CHALLENGES`, `findMatches`, `findHint`, `scoreMatch`, `goalForLevel`, and `movesForLevel`. `createGame({ random })` accepts a deterministic `random()` so a check does not depend on `Math.random`.

The repository ships the cabinet without a test runner or test files. The header comment in `git-blocks.js` describes Node as a place to exercise the engine; the require above is that check.
