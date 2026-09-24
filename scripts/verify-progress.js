/**
 * Engine check for cloud-save snapshots. No network and no Supabase credentials.
 * Run from the repository root: node scripts/verify-progress.js
 */
"use strict";

const assert = require("assert");
const gb = require("../git-blocks.js");

function mulberry32(seed) {
  let state = seed >>> 0;
  return function random() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function playUntilTrophy(random) {
  const game = gb.createGame({ random });
  const reasons = [];
  game.setProgressHook((_snap, reason) => {
    reasons.push(reason);
  });
  assert.strictEqual(game.choosePathway("frontend"), true);
  game.play();
  assert.ok(reasons.indexOf("start") !== -1);

  let guard = 0;
  while (game.snapshot().matches < 3 && guard < 60) {
    const hint = gb.findHint(game.snapshot().board);
    if (!hint) {
      if (!game.shuffle()) break;
    } else {
      game.trySwap(hint.a, hint.b);
    }
    guard += 1;
  }
  return { game, reasons };
}

let played = null;
for (let seed = 1; seed < 40; seed += 1) {
  const attempt = playUntilTrophy(mulberry32(seed));
  if (attempt.game.snapshot().trophies.some((trophy) => trophy.id === "rubber-duck")) {
    played = attempt;
    break;
  }
}

assert.ok(played, "expected a seed that unlocks the Rubber Duck trophy");
const { game, reasons } = played;
assert.ok(reasons.indexOf("match") !== -1 || reasons.indexOf("trophy") !== -1);
game.pause();
assert.strictEqual(game.status, "paused");
assert.ok(reasons.indexOf("pause") !== -1);

const save = gb.cloudSaveFromSnapshot(game.snapshot(), 42);
assert.strictEqual(save.pathwayId, "frontend");
assert.strictEqual(save.phase, "path");
assert.strictEqual(save.status, "paused");
assert.ok(save.score > 0);
assert.ok(save.bestScore >= 42);
assert.ok(save.trophies.some((trophy) => trophy.id === "rubber-duck"));
assert.ok(save.questTitle);

const userId = "00000000-0000-0000-0000-000000000001";
const row = gb.toPlayerSaveRow(userId, save);
assert.strictEqual(row.user_id, userId);
assert.strictEqual(row.pathway_id, "frontend");
assert.strictEqual(row.high_score, save.bestScore);
assert.ok(Array.isArray(row.trophies));
assert.strictEqual(row.trophies[0].test, undefined);

const restoredGame = gb.createGame({ random: mulberry32(99) });
assert.strictEqual(restoredGame.restoreCloudSave(row), true);
const restored = restoredGame.snapshot();
assert.strictEqual(restored.pathwayId, "frontend");
assert.strictEqual(restored.status, "paused");
assert.strictEqual(restored.linesOfCode, save.score);
assert.strictEqual(restored.moves, save.moves);
assert.ok(restored.trophies.some((trophy) => trophy.id === "rubber-duck"));

const merged = gb.mergeCloudSaves(
  {
    pathwayId: "frontend",
    score: 10,
    bestScore: 10,
    trophies: [{ id: "rubber-duck", name: "Rubber Duck" }],
    loot: [],
    updatedAt: "2026-01-01T00:00:00.000Z",
    level: 1,
    moves: 40,
    phase: "path",
    status: "paused",
  },
  {
    pathway_id: "backend",
    score: 50,
    high_score: 80,
    trophies: [{ id: "green-check", name: "Green Check" }],
    items: [{ id: "coffee-mug", name: "Deploy Mug" }],
    updated_at: "2026-06-01T00:00:00.000Z",
    level: 3,
    moves: 20,
    phase: "path",
    status: "paused",
  }
);
assert.strictEqual(merged.pathwayId, "backend");
assert.strictEqual(merged.level, 3);
assert.strictEqual(merged.score, 50);
assert.strictEqual(merged.bestScore, 80);
assert.ok(merged.trophies.some((trophy) => trophy.id === "rubber-duck"));
assert.ok(merged.trophies.some((trophy) => trophy.id === "green-check"));
assert.ok(merged.loot.some((item) => item.id === "coffee-mug"));

console.log(
  "verify-progress ok",
  save.score + " LOC",
  save.trophies.map((trophy) => trophy.id).join(", ")
);
