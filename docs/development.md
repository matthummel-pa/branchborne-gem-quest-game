# Development

The cabinet is a static page. There is no package manifest, bundler, or committed test runner. `git-blocks.js` is a vanilla IIFE: in the browser it assigns `GitBlocks` and `Branchborne` on the global object, and in Node it assigns `module.exports`.

## Repo layout

```
index.html                         Cabinet shell: title, stats, buttons, customize and save forms
git-blocks.js                      Rules, curriculum, pathways, canvas, audio, UI boot, save payload
git-blocks.css                     Layout and theme
security.js                        Shared checks for HTML, CSS, URLs, storage keys, and publishable keys
cloud-sync.js                      Optional Supabase auth and upserts, using fetch and the publishable key
netlify.toml                       Static publish of the repo root, security headers, and the functions directory
netlify/functions/public-config.ts GET /api/public-config (URL and publishable key only)
supabase/migrations/               SQL for public.branchborne_saves
scripts/verify-progress.js         Node check for snapshot, trophy sync, and restore
audio/                             stack-sprint.ogg and stack-sprint.wav
docs/                              Player guide, this note, support, screenshots
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

The script paints several surfaces that are not in the HTML: the pathway cards, the mana bar and **Cast** button, the quest rail contents, and the trophy dialog. Edit those in `git-blocks.js` (`paintClassSelect`, `paintMana`, `paintQuestRail`, `paintTrophyBoard`). The **Save** panel markup lives in `index.html` and is wired by `cloud-sync.js`.

`window.GitBlocksConfig` is optional. `shareUrl` overrides the link builder, and `autoStart: true` calls play when status is already `ready`. The checked-in page does not set that flag; a run starts when a pathway card is clicked.

## Lines of code, curriculum, and pathways

These all live in `git-blocks.js`.

- **Board.** `SIZE`, `COLS`, and `ROWS` are 8. `MATCH_MIN` is 3. `GEMS` is the logo set. `findMatches` scans rows and columns. `trySwap` rejects a swap that does not create a match and does not spend a move.
- **Lines of code.** `scoreMatch(cellCount, chain, level, affinityHits)` is the LOC for one wave: `cellCount * 28`, times a chain bonus, a level bonus, and a small affinity bonus. `applyWaves` adds that to `state.linesOfCode` (also exposed as `score`) and to `levelScore`, which is what the quest bar uses. Query Storm sets `locMultiplier` to 2 for the next wave, then clears it. Polyglot Pulse adds `Math.max(120, combo * 90 + 180)` directly.
- **Goals and moves.** `goalForLevel` is `600 + (level - 1) * 350` on the learning path. Raid goals and move budgets are the `goal` and `moves` fields on each `ENDGAME_CHALLENGES` entry. `movesForLevel` on the path is `Math.max(28, 48 - min(10, level - 1))`. The subtraction stops at 10, so the opening bank goes 48, 47, … and levels off at 38. The `28` floor is in the formula and is not reached by that countdown.
- **Curriculum.** `CURRICULUM` is the 20 lessons. Each entry has `id`, `title`, `track`, `rank`, `skill`, `clouds`, and `facts`. `grantLessonSkill` records the skill the first time that lesson is entered.
- **Pathways.** `PATHWAY_CLASSES` is Frontend Mage (`frontend`), Backend Sentinel (`backend`), WordPress Artisan (`wordpress`), and Full-Stack Ranger (`fullstack`). Each has `affinity`, `lessonIds`, backdrop, and `power`. Full-Stack Ranger's `lessonIds` is every curriculum id. The **Classic learning path** card is not a fifth engine pathway: its click handler calls `choosePathway("fullstack")`.
- **Collection.** `TROPHIES` and `LOOT_ITEMS` are catalogs with `test(state)` predicates. `ACHIEVEMENTS` feeds the badge row the same way.
- **Saved data.** `STORAGE.high` is `git-blocks-high-score`. `STORAGE.prefs` is `git-blocks-prefs-v2`. `STORAGE.progress` is `git-blocks-progress-v1`. `boot` appends `:guest` or `:u:<user-id>` so accounts do not share those keys. `createGame` keeps the live run in memory and calls `setProgressHook` after a resolved match, a trophy or loot unlock, pause, quest start, and game end. `cloud-sync.js` upserts `public.branchborne_saves` when a session exists. `cloudSaveFromSnapshot`, `toPlayerSaveRow`, `canonicalCloudSave`, and `mergeCloudSaves` are the shared shape.

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

The repository has no test runner. `node scripts/verify-progress.js` plays a seeded Frontend Mage board until the Rubber Duck trophy drops, pauses, builds a `branchborne_saves` row, restores it into a second game, and checks that a merge keeps the newer quest plus both trophy lists.

## Netlify

`netlify.toml` publishes `.`, bundles `netlify/functions` with esbuild, and runs `node scripts/security-check.js` as the build command. There is no bundler for the cabinet. `public-config.ts` reads `Netlify.env.get` for `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` (falling back to `SUPABASE_ANON_KEY`). Names and where to set them are in [Support](support.md#cloud-save). `.env.example` lists the same names with empty placeholders.

Publish when the Netlify CLI is logged in:

```bash
npx netlify status
npx netlify link --git-remote-url https://github.com/matthummel-pa/branchborne-gem-quest-game
npx netlify deploy --prod --dir .
```

`npx netlify login` is required first when `netlify status` says you are not logged in. Create the site with `npx netlify init` if the link finds no site. Set the three environment variables in the Netlify site UI before relying on `/api/public-config`.

## Supabase

The live schema is project ref `noxzzvbmcckzmaohyahe`, table `public.branchborne_saves`. The migration `supabase/migrations/20260924201136_extend_branchborne_saves.sql` adds quest columns and replaces the policies so `authenticated` can select, insert, update, and delete only where `(select auth.uid()) = user_id`. `anon` has no grants on that table. The browser uses the publishable key. Do not ship a service-role key.

`public.branchborne_players` is an older anonymous table on the same project. This cabinet does not read or write it. Its policies still allow `anon` to select and update every row (`using (true)`). Leave it in place until you confirm nothing else depends on it, then tighten or drop it in the Supabase SQL editor.

`public.enforce_allowlist` blocks new `auth.users` rows whose email is not in `public.allowed_users`. That trigger protects the rest of this project. Do not drop it to open the game. Add a player email to `allowed_users`, or point the cabinet at another project.
