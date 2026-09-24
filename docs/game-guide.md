# Player guide

Branchborne Gem Quest is an 8×8 match-3. You swap tech gems, write lines of code, and walk a web-development pathway from the first lesson to Senior, then four class Expert raids.

## Start a run

The cabinet opens on **Choose your pathway**. Click a card. That choice sets your lessons, the gems that show up more often, and your class power. The first lesson begins immediately.

| Card | What you play | Power |
| --- | --- | --- |
| Classic learning path | All 20 lessons, in curriculum order | Polyglot Pulse |
| Full-Stack Ranger | The same 20-lesson path | Polyglot Pulse |
| Frontend Mage | 18 interface lessons | Style Nova |
| Backend Sentinel | 15 server and API lessons | Query Storm |
| WordPress Artisan | 15 CMS lessons | Hook Cascade |

Classic learning path and Full-Stack Ranger are two doors into one path. Both select the fullstack pathway.

Affinity gems are your class stack. They appear more often, fill the power bar faster, and score a little extra LOC. Early lessons use a smaller set of gem colors. More logos join the board as the quest number climbs.

## Swap rules

- The board is 8 columns by 8 rows.
- Swap two gems that share an edge (up, down, left, or right).
- Click one gem, then an adjacent gem. A drag from one gem onto a neighbor does the same thing.
- A swap that misses a match of three bounces back and leaves the move bank unchanged.
- A match is three or more identical gems in a straight row or column.
- Cleared gems shatter, gems above fall, and new gems drop in. A new match from that fall is a cascade and keeps scoring.

## Lines of code, moves, and the goal

**Lines of code** is the score. Longer matches, cascades, later lessons, and affinity gems write more LOC. The run total is the big LOC number. The quest bar tracks LOC toward the current goal only.

- Lesson 1 asks for **600 LOC**. Each later lesson adds 350 LOC to that goal.
- Lesson 1 starts with **48 moves**. Each later lesson opens with one move fewer, until the opening bank levels off at 38.
- A successful clear refunds moves: one move back, plus one more for each extra step in the cascade, up to four moves returned.
- On the learning path, an empty move bank refills with 12 so you can finish the quest.
- **Best LOC** on the sidebar is the best total this browser has shown. It is written into local storage when a run reaches the end screen (a failed raid, or Class Expert).

## Hint and shuffle

You start each career with **2 hints** and **2 shuffles**. The cap for each is 3. Clearing a lesson grants one more of each, up to that cap.

- **Hint** (or `H`) lights a legal swap.
- **Shuffle** (or `S` while the board is focused) rebuilds the grid with no match already sitting on it.
- If the board has no legal swap, the game spends a shuffle for you. With none left on the learning path, it refreshes the board and adds 8 moves.

## Class powers

Matches fill a mana bar. At 100% the side button becomes **Cast** plus the power name.

| Power | Pathway | What it does |
| --- | --- | --- |
| Style Nova | Frontend Mage | Clears every gem of one affinity type, then resolves the fall and any cascade. |
| Query Storm | Backend Sentinel | Adds 4 moves and doubles LOC on the next match wave. |
| Hook Cascade | WordPress Artisan | Reshuffles the board and refills hints and shuffles (two each, still capped at 3). |
| Polyglot Pulse | Classic learning path and Full-Stack Ranger | Adds `combo × 90 + 180` LOC (180 on a quiet board, more as the combo climbs). A burst that finishes the quest levels you up. |

## Side quests

The rail on the right is the live quest: title, rank, a dev tip from that lesson, and progress toward the LOC goal. The reward named on the card is the skill for that lesson. Matching until the goal fills advances you, and the board stays in play.

Each lesson also unlocks a skill chip under the controls. The first quest, HTML bones, unlocks **Markup Adept** as soon as the run starts.

### Curriculum skills

Classic and Full-Stack Ranger walk this list in order. The other pathways use a subset, in their own order.

| Lesson | Skill |
| --- | --- |
| HTML bones | Markup Adept |
| CSS paint | Style Caster |
| Layout lab | Flex Sensei |
| Responsive craft | Viewport Ranger |
| JS spark | Script Starter |
| DOM & events | DOM Whisperer |
| Git flow | Commit Keeper |
| Tooling & npm | Package Pilot |
| Accessibility | A11y Guardian |
| TypeScript | Type Warden |
| React components | Component Crafter |
| State & hooks | State Alchemist |
| PHP & WordPress | CMS Artisan |
| APIs & data | Fetch Ranger |
| Testing craft | Spec Sentinel |
| Performance | Perf Pathfinder |
| Web security | Threat Shield |
| Architecture | System Cartographer |
| Tech leadership | Mentor Beacon |
| Senior developer | Senior Sigil |

## Senior and class Expert

Finishing the last lesson of your pathway graduates you to Senior and opens raids. The board keeps going. Each raid is a harder LOC goal with a tighter move cap:

| Raid | Goal | Move budget |
| --- | --- | --- |
| Production Outage | 2200 | 18 |
| Legacy Refactor | 2600 | 16 |
| Traffic Spike | 3000 | 14 |
| Security Siege | 3400 | 12 |

**Rebase** retries the current raid with that move budget and keeps your pathway. Running out of moves before the goal ends that attempt. Clearing every raid makes you **Class Expert**. **New career** returns you to pathway select. If you still have more moves than the next raid grants, you keep the larger bank.

## Trophies and loot

**Trophies** opens the trophy and loot case: 10 trophies and 10 items. Locked slots show the name and “Keep questing.” Earned slots show an icon and a short line. A toast appears when you earn one. The case can be opened during play; `Escape` or **Close** dismisses it. The case is a collection; earning an item leaves the board rules as they are.

| Trophy | Earned when |
| --- | --- |
| Rubber Duck | 3 matches |
| Green Check | 10 matches |
| Lighthouse 100 | Lesson 4 |
| A11y Medal | Lesson 6 |
| PR Stamp | 2 matches of four or more |
| Ship in a Bottle | A cascade chain of 4 |
| Type Shield | Lesson 8 |
| Senior Crest | Senior graduation |
| Raid Banner | 1 raid cleared |
| Expert Sigil | Class Expert |

| Item | Earned when |
| --- | --- |
| Mech Keyboard | 30 gems cleared |
| Deploy Mug | 5 matches |
| USB Stick | Combo of 4 |
| API Keycard | Lesson 7 |
| Dual Monitor | 800 LOC |
| Container Whale | Lesson 9 |
| GraphQL Orb | 2 powers cast |
| CDN Feather | 2000 LOC |
| Observability Totem | 2 raids cleared |
| Legacy Amulet | Class Expert |

## Customize

**Customize** has three tabs.

- **Look** — backdrop presets (Navy, Ink, Aurora, Term, Ember), Advanced or Simple graphics, a custom CSS background, or an image URL. **Random gradient** fills the CSS field.
- **Music** — Stack sprint (the theme in `audio/`), generated loops, music off, or a custom audio URL. Volume, preview, and sound-effect buttons live here. **Find free tracks** swaps in a fresh set of in-browser loops.
- **Share** — copies a link to this cabinet. Leave “Include look + music in the link” checked to bake the current Look and Music into the `#gb=` hash. System share, X, and LinkedIn use that same URL.

**Share** in the top bar opens the Share tab directly. **Sound on / Sound off** mutes effects and music. **Pause** freezes the run; the button becomes **Resume**.

## Keyboard and mouse

| Input | Action |
| --- | --- |
| Click, then click an adjacent gem | Swap |
| Drag onto a neighboring gem | Swap |
| Click the same gem again | Clear the selection |
| `H` | Hint, while playing |
| `S` | Shuffle, while the board canvas is focused |
| `P` | Pause or resume |
| `Enter` | Continue when the run is waiting |
| `R` | Rebase after a raid ends |
| `Escape` | Close the trophy case or Customize |

Move gems with the pointer. The arrow keys leave the selection where it is.

## What this browser remembers

The quest, skills, trophies, and loot for the current run stay in the page. A reload starts you back at pathway select.

Two values stay in `localStorage` for this site:

| Key | What it stores |
| --- | --- |
| `git-blocks-high-score` | Best LOC, saved when a run reaches the end screen |
| `git-blocks-prefs-v2` | Look, music, volume, and graphics |

A shared link can also reapply Look and Music from its `#gb=` hash. See [Support](support.md) to clear any of that.
