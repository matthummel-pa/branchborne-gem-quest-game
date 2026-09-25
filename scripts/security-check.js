/**
 * Local security checks for the cabinet. No network and no secrets.
 * Run from the repository root: node scripts/security-check.js
 */
"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const sec = require("../security.js");
const gb = require("../git-blocks.js");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

assert.strictEqual(sec.escapeHtml(`<img src=x onerror=alert(1)>`), "&lt;img src=x onerror=alert(1)&gt;");
assert.strictEqual(sec.sanitizeCssBackground('red; background: url(https://evil.test/x)'), "");
assert.strictEqual(sec.sanitizeHttpsUrl("javascript:alert(1)"), "");
assert.strictEqual(sec.sanitizeHttpsUrl("https://user:pass@example.com/a"), "");
assert.ok(sec.sanitizeCssBackground(gb.BG_PRESETS[0].css));
assert.strictEqual(sec.isPublishableKey("sb_secret_not_a_browser_key"), false);
assert.strictEqual(sec.isPublishableKey("sb_publishable_example_key"), true);
assert.strictEqual(sec.isSupabaseProjectUrl("https://example.com"), false);
assert.strictEqual(sec.isSupabaseProjectUrl("http://abcd.supabase.co"), false);

const guest = sec.storageKey("git-blocks-progress-v1", null);
const userA = sec.storageKey("git-blocks-progress-v1", "00000000-0000-0000-0000-00000000000a");
const userB = sec.storageKey("git-blocks-progress-v1", "00000000-0000-0000-0000-00000000000b");
assert.notStrictEqual(guest, userA);
assert.notStrictEqual(userA, userB);
assert.ok(!userA.includes("00000000-0000-0000-0000-00000000000b"));
assert.strictEqual(gb.playerStorageKey("git-blocks-progress-v1", null), guest);

const poisoned = gb.createGame({ random: () => 0.2 });
assert.strictEqual(
  poisoned.restoreCloudSave({
    pathwayId: "frontend",
    status: "paused",
    score: 12,
    trophies: [{ id: "rubber-duck", name: "<img src=x onerror=alert(1)>" }, { id: "<script>", name: "nope" }],
    skills: [{ id: "markup", name: "<script>alert(1)</script>" }],
  }),
  true
);
const snap = poisoned.snapshot();
const duck = snap.trophies.find((trophy) => trophy.id === "rubber-duck");
assert.ok(duck);
assert.strictEqual(duck.name, "Rubber Duck");
assert.ok(!snap.trophies.some((trophy) => String(trophy.name).includes("<")));
assert.ok(!snap.skills.some((skill) => String(skill.name).includes("<")));

const savesSql = read("supabase/migrations/20260924201136_extend_branchborne_saves.sql");
assert.ok(savesSql.includes("enable row level security"));
assert.ok(savesSql.includes("to authenticated"));
assert.ok(savesSql.includes("revoke all on table public.branchborne_saves from anon"));
assert.ok(!/create policy[\s\S]+to anon/i.test(savesSql));

const ownerSql = read("supabase/migrations/20260924203000_player_rls.sql");
assert.ok(ownerSql.includes("new.user_id := auth.uid()"));
assert.ok(ownerSql.includes("revoke insert, update, delete"));

const configFn = read("netlify/functions/public-config.ts");
assert.ok(configFn.includes('payload.role === "service_role"'));
assert.ok(configFn.includes("sb_secret_"));
assert.ok(!configFn.includes("SUPABASE_SERVICE_ROLE"));

const cloud = read("cloud-sync.js");
assert.ok(!cloud.includes("cdn.jsdelivr.net"));
assert.ok(!cloud.includes("innerHTML"));
assert.ok(cloud.includes("sessionStorage"));
assert.ok(cloud.includes("_branchborneSetScope"));

const html = read("index.html");
assert.ok(html.includes("Content-Security-Policy"));
assert.ok(!html.includes("account.js"));
assert.ok(!html.includes("data-account-email"));
assert.ok(!html.includes("data-account-password"));
assert.ok(!html.includes("Email me a link"));
assert.ok(!html.includes('type="email"'));
assert.ok(!html.includes('type="password"'));

const toml = read("netlify.toml");
assert.ok(toml.includes("X-Frame-Options"));
assert.ok(toml.includes("X-Content-Type-Options"));
assert.ok(toml.includes("Referrer-Policy"));
assert.ok(toml.includes("Content-Security-Policy"));
assert.ok(!toml.includes("http://") && !/to\s*=\s*"https?:/i.test(toml));

const gitignore = read(".gitignore");
assert.ok(gitignore.includes("supabase-public.json"));
assert.ok(gitignore.includes(".env"));

console.log("security-check ok");
