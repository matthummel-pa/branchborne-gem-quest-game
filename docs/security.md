# Security

Branchborne Gem Quest is a static cabinet. Scores and trophies are gameplay records, not payments or private messages. This note is the threat model for the published game.

## What is protected

- **Someone else's save.** `public.branchborne_saves` has Row Level Security. A signed-in player can select, insert, update, and delete only the row whose `user_id` is `auth.uid()`. Anonymous clients have no grants on that table. A database trigger replaces `user_id` with the signed-in user, so the browser cannot pick another player's row.
- **The browser key.** The page and `GET /api/public-config` may receive the project URL and a publishable key (`sb_publishable_...` or a legacy anon JWT whose role is `anon`). A secret or service-role key is rejected and is not returned. Do not commit real keys. `supabase-public.json` is local only and gitignored.
- **Passwords.** The Save form posts only from script, over HTTPS to the Supabase project. The password is not written to `localStorage`, the share link, or the commit log. Fields are cleared after submit. Sessions live in `sessionStorage` for the tab, not in a shared long-lived game key.
- **Shared browsers.** Guest progress and each account's fallback use different `localStorage` keys. Signing in does not copy the guest save into the account. Signing out drops back to the guest key and does not leave the account row in it.
- **HTML injection.** Displayed names, quest text, trophy labels, and the commit log are inserted as text. Custom backdrops accept colors and gradients, not `url()`, and a share link does not carry an image or audio URL. Remote images and music that you type in yourself must be a single `https` URL.
- **Framing and headers.** `netlify.toml` sends a content security policy, `X-Frame-Options: DENY`, `nosniff`, and a strict referrer policy. There is no open redirect. Magic-link and signup redirects stay on this cabinet's origin and path.

The cabinet uses Supabase project `ybmseuuumwiyudwqvzuh` ([dashboard](https://supabase.com/dashboard/project/ybmseuuumwiyudwqvzuh)). `public.branchborne_players` is not on that project. Saves live only in `public.branchborne_saves`.

## What a determined player can still change

The match is scored in the browser. A player who edits their own request can raise their lines of code, mark their own trophies, or change their own quest fields. Row Level Security does not make the score authoritative. It only stops that player from reading or writing someone else's row.

Look and music preferences are also local. A shared `#gb=` link can restyle the cabinet with a gradient. It cannot run script.

## How to report a problem

Open an issue on [matthummel-pa/branchborne-gem-quest-game](https://github.com/matthummel-pa/branchborne-gem-quest-game/issues). Describe what you expected, the browser, and whether you were signed in. Do not include passwords, session tokens, or a service-role key.

The owner is Matt Hummel. This repository does not publish a support email.
