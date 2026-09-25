# Support

## Browsers

Use a current Chrome, Firefox, Safari, or Edge. The cabinet needs canvas, pointer events, `localStorage`, and either Web Audio or HTML audio. JavaScript has to be enabled. Serve the files over HTTP from the repository root (see [Play locally](../README.md#play-locally)).

## Sound and autoplay

Music starts when you pick a pathway, which is a click, so the browser has a user gesture. The theme is `audio/stack-sprint.ogg`. If that `play()` call is rejected, the cabinet falls back to a generated ambient loop.

- **Sound off** stops music and ignores new effects until you turn sound back on.
- **Customize → Music** can switch to a generated loop, paste your own URL, change volume, or choose **Music off**.
- Effects are synthesized in an `AudioContext` (select, swap, match, cascade, start). Use the preview buttons on the Music tab to hear them.
- A quiet browser is often a blocked autoplay or a missing `audio/` file because the page was not served from the repo root. The board still runs.

## Cloud save

The Save screen does not ask for an email or a password. Ship a JSON file from that panel, or keep the guest quest in this browser. The board runs either way.

The browser asks `GET /api/public-config` first, then `./supabase-public.json`. Either source must include a project URL and a publishable key. Copy `supabase-public.example.json` to `supabase-public.json` for a local static server. That file is gitignored. On Netlify, set these site environment variables and leave the values out of git:

| Variable | Purpose |
| --- | --- |
| `SUPABASE_URL` | `https://ybmseuuumwiyudwqvzuh.supabase.co` |
| `SUPABASE_PUBLISHABLE_KEY` | Publishable key (`sb_publishable_...`). This is the key the browser uses. |
| `SUPABASE_ANON_KEY` | Legacy anon key. The function uses it only when `SUPABASE_PUBLISHABLE_KEY` is unset. |

Do not set a service-role or secret key in these variables. The function returns only the public URL and publishable key, and Row Level Security on `public.branchborne_saves` limits each signed-in user to their own row.

The linked Netlify site is [gregarious-custard-70cf58](https://gregarious-custard-70cf58.netlify.app). `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` are set there. The publishable key is not in git.

This release uses Supabase project `ybmseuuumwiyudwqvzuh` (`https://ybmseuuumwiyudwqvzuh.supabase.co`). Open [https://supabase.com/dashboard/project/ybmseuuumwiyudwqvzuh](https://supabase.com/dashboard/project/ybmseuuumwiyudwqvzuh) for Authentication → URL Configuration. Add `https://gregarious-custard-70cf58.netlify.app` and `http://127.0.0.1:4173` as redirect URLs so magic links land on the cabinet. This project has no `public.allowed_users` table and no allowlist trigger, so a new player email can sign up. Guest progress still stays in `localStorage` when nobody is signed in.

If `/api/public-config` is missing, the Save panel says cloud save is off and the quest stays in this browser.

## JSON save file

**Save** shows a JSON prompt before the form. **Continue** opens **Ship your save**, which downloads `branchborne-save.json` in this browser. **Not now** dismisses the prompt. It does not need Supabase. The panel’s JSON lesson and preview are your current quest. **Open this save** puts a file of that shape back on the board.

- Leave the PIN blank for a file anyone can open in the game.
- A PIN is 4–8 letters or digits. The file keeps a SHA-256 hash and a salt. The cabinet does not store the PIN.
- “That PIN does not open this save” means the hash did not match. The board stays as it was.
- “That file is not a Branchborne save” means the JSON is not this cabinet’s progress object.
- Editing the file can change your own trophies. The PIN is not server-side security. See [Security](security.md).

## Reset local progress

Quest progress, trophies, and loot are stored for this origin, along with best LOC and look/music. Guest play and each signed-in account use different keys, so one player does not read another's save on a shared browser.

| Key | Contents |
| --- | --- |
| `git-blocks-progress-v1:guest` | Guest pathway, quest, LOC, moves, trophies, loot, skills |
| `git-blocks-progress-v1:u:<user-id>` | That account's browser fallback |
| `git-blocks-high-score:guest` and `git-blocks-high-score:u:<user-id>` | Best LOC for that scope |
| `git-blocks-prefs-v2:guest` and `git-blocks-prefs-v2:u:<user-id>` | Look, music, volume, graphics for that scope |

Older unscoped keys (`git-blocks-progress-v1`, `git-blocks-high-score`, `git-blocks-prefs-v2`) are read only for the guest, and new writes do not go back to them.

To clear them, open the developer tools for `http://127.0.0.1:4173/`, remove the keys for the scope you want, and reload. Clearing site data for that origin does the same thing. That does not delete the Supabase row. Sign in and play, or delete your own `branchborne_saves` row, to change the cloud copy. Signing in does not import the guest save.

A share link may end with `#gb=` and a payload that reapplies Look and Music. Strip the hash and reload when you want the default navy cabinet instead of a shared backdrop.

## The board will not start

Work through these in order:

1. Start the server in the repository root, then open `http://127.0.0.1:4173/`. A `file://` open, or a server pointed at a subfolder, leaves `git-blocks.js` or `audio/` unresolved and the shell never boots.
2. Click a pathway card. Clicks on the canvas do nothing while **Choose your pathway** is up.
3. Hard-refresh if the cards are visible and do not respond. The class menu is built once per visit; a stale cached script can leave it stuck.
4. Confirm JavaScript is allowed for the origin. With the script blocked, the page is only the empty shell.
5. If a shared `#gb=` image URL fails to load, the backdrop can look blank. Remove the hash. The canvas should still be on the page.
6. Private browsing can refuse `localStorage`. The match still starts; Best LOC and Customize prefs will not stick.

Pause only freezes a run that is already playing. It does not start one.

## Report an issue

Open an issue on [matthummel-pa/branchborne-gem-quest-game](https://github.com/matthummel-pa/branchborne-gem-quest-game/issues). Include the browser, the pathway, and whether you were on the learning path or a raid. A screenshot of the cabinet and the console error, when there is one, is enough to reproduce most failures.

Use that issue tracker for reports. This repository does not publish a support email. Security reports go to the same tracker; see [Security](security.md).
