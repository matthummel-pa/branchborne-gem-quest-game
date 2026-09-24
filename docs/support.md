# Support

## Browsers

Use a current Chrome, Firefox, Safari, or Edge. The cabinet needs canvas, pointer events, `localStorage`, and either Web Audio or HTML audio. JavaScript has to be enabled. Serve the files over HTTP from the repository root (see [Play locally](../README.md#play-locally)).

## Sound and autoplay

Music starts when you pick a pathway, which is a click, so the browser has a user gesture. The theme is `audio/stack-sprint.ogg`. If that `play()` call is rejected, the cabinet falls back to a generated ambient loop.

- **Sound off** stops music and ignores new effects until you turn sound back on.
- **Customize → Music** can switch to a generated loop, paste your own URL, change volume, or choose **Music off**.
- Effects are synthesized in an `AudioContext` (select, swap, match, cascade, start). Use the preview buttons on the Music tab to hear them.
- A quiet browser is often a blocked autoplay or a missing `audio/` file because the page was not served from the repo root. The board still runs.

## Reset local progress

Reload the page to drop the current quest, skills, trophies, and loot. Those live in the page, not in storage.

Best LOC and the cabinet's look and music do persist for this origin:

| Key | Contents |
| --- | --- |
| `git-blocks-high-score` | Best LOC saved when a run hits the end screen |
| `git-blocks-prefs-v2` | Backdrop, music track, volume, graphics quality |

To clear them, open the developer tools for `http://127.0.0.1:4173/`, remove those two `localStorage` keys, and reload. Clearing site data for that origin does the same thing.

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

Use that issue tracker for reports. This repository does not publish a support email.
