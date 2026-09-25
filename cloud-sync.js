/**
 * Optional Supabase sync for Branchborne Gem Quest.
 * Uses the publishable key only. Guest localStorage is not copied into an account.
 */
(function () {
  "use strict";

  var SESSION_KEY = "git-blocks-auth-session";
  var PKCE_KEY = "git-blocks-pkce-verifier";

  function start() {
    var root = document.querySelector("[data-git-blocks]");
    var sec = window.BranchborneSecurity;
    if (!root || !window.GitBlocks || !sec) return;
    var game = root._branchborneGame;
    var panel = root.querySelector("[data-account-panel]");
    var openBtn = root.querySelector("[data-account]");
    var config = null;
    var session = null;
    var pushTimer = 0;
    var pending = null;

    var jsonStatusEl = root.querySelector("[data-json-status]");
    var jsonLessonEl = root.querySelector("[data-json-lesson]");
    var jsonPreviewEl = root.querySelector("[data-json-preview]");
    var jsonPinInput = root.querySelector("[data-json-pin]");
    var jsonFileInput = root.querySelector("[data-json-file]");
    var jsonImportPinField = root.querySelector("[data-json-import-pin-field]");
    var jsonImportPin = root.querySelector("[data-json-import-pin]");
    var pendingPortable = null;
    var pendingNeedsPin = false;

    function setJsonStatus(text) {
      if (jsonStatusEl) jsonStatusEl.textContent = text ? String(text).slice(0, 220) : "";
    }

    function currentPortableSave() {
      if (!game || typeof game.snapshot !== "function") return null;
      var snap = game.snapshot();
      var stored = typeof root._branchborneReadProgress === "function" ? root._branchborneReadProgress() : null;
      var best = stored && stored.bestScore ? stored.bestScore : 0;
      var lines = snap && snap.linesOfCode ? snap.linesOfCode : 0;
      return window.GitBlocks.cloudSaveFromSnapshot(snap, Math.max(best, lines));
    }

    function refreshJsonLesson() {
      if (!window.GitBlocks || typeof window.GitBlocks.portableSaveLesson !== "function") return;
      var lesson = window.GitBlocks.portableSaveLesson(currentPortableSave());
      if (jsonLessonEl) jsonLessonEl.textContent = lesson.text;
      if (jsonPreviewEl) jsonPreviewEl.textContent = lesson.preview;
    }

    function clearImportPin() {
      if (jsonImportPin) jsonImportPin.value = "";
    }

    function showImportPin(show) {
      pendingNeedsPin = Boolean(show);
      if (!jsonImportPinField) return;
      jsonImportPinField.hidden = !show;
      if (show) jsonImportPinField.removeAttribute("hidden");
      else jsonImportPinField.setAttribute("hidden", "");
      if (!show) clearImportPin();
    }

    function downloadJson(filename, value) {
      var blob = new Blob([JSON.stringify(value, null, 2) + "\n"], { type: "application/json" });
      var url = URL.createObjectURL(blob);
      var link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.rel = "noopener";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
    }

    function applyPortableSave(result) {
      if (!result || !result.ok) {
        setJsonStatus(result && result.error ? result.error : "That file is not a Branchborne save. Ship one from this cabinet first.");
        return;
      }
      if (!game || typeof game.restoreCloudSave !== "function" || !game.restoreCloudSave(result.save)) {
        setJsonStatus("That file is not a Branchborne save. Ship one from this cabinet first.");
        return;
      }
      if (typeof root._branchborneRemember === "function") root._branchborneRemember(result.save);
      if (typeof root._branchborneCloudPush === "function") root._branchborneCloudPush(result.save, "pause");
      pendingPortable = null;
      pendingNeedsPin = false;
      showImportPin(false);
      if (jsonFileInput) jsonFileInput.value = "";
      setJsonStatus(result.summary || "Restored this save.");
      refreshJsonLesson();
    }

    var promptEl = root.querySelector("[data-json-prompt]");
    var promptCopyEl = root.querySelector("[data-json-prompt-copy]");
    var promptLineEl = root.querySelector("[data-json-prompt-line]");

    function hideCustomize() {
      var customize = root.querySelector("[data-customize-panel]");
      if (!customize) return;
      customize.hidden = true;
      customize.setAttribute("hidden", "");
      root.classList.remove("is-customizing");
    }

    function hidePrompt() {
      if (!promptEl) return;
      promptEl.hidden = true;
      promptEl.setAttribute("hidden", "");
    }

    function showPrompt() {
      if (!promptEl || !window.GitBlocks || typeof window.GitBlocks.jsonDoorCopy !== "function") return;
      var door = window.GitBlocks.jsonDoorCopy(currentPortableSave());
      if (promptCopyEl) promptCopyEl.textContent = door.text;
      if (promptLineEl) promptLineEl.textContent = door.line;
      hideCustomize();
      promptEl.hidden = false;
      promptEl.removeAttribute("hidden");
      var continueBtn = root.querySelector("[data-json-prompt-continue]");
      if (continueBtn) continueBtn.focus();
    }

    function togglePanel(forceOpen) {
      if (!panel) return;
      var open = typeof forceOpen === "boolean" ? forceOpen : panel.hidden;
      panel.hidden = !open;
      if (open) panel.removeAttribute("hidden");
      else panel.setAttribute("hidden", "");
      if (open) {
        hidePrompt();
        refreshJsonLesson();
        hideCustomize();
      }
    }

    if (openBtn) openBtn.addEventListener("click", function () {
      if (panel && !panel.hidden) {
        togglePanel(false);
        return;
      }
      if (promptEl && !promptEl.hidden) {
        hidePrompt();
        return;
      }
      showPrompt();
    });
    root.querySelectorAll("[data-account-close]").forEach(function (btn) {
      btn.addEventListener("click", function () { togglePanel(false); });
    });
    root.querySelectorAll("[data-json-prompt-dismiss]").forEach(function (btn) {
      btn.addEventListener("click", function () { hidePrompt(); });
    });
    var promptContinue = root.querySelector("[data-json-prompt-continue]");
    if (promptContinue) {
      promptContinue.addEventListener("click", function () { togglePanel(true); });
    }
    var customizeBtn = root.querySelector("[data-customize]");
    if (customizeBtn) customizeBtn.addEventListener("click", hidePrompt);
    window.addEventListener("keydown", function (event) {
      if (event.key !== "Escape" || !promptEl || promptEl.hidden) return;
      event.preventDefault();
      event.stopPropagation();
      hidePrompt();
    }, true);

    var downloadBtn = root.querySelector("[data-json-download]");
    if (downloadBtn) {
      downloadBtn.addEventListener("click", function () {
        var pin = jsonPinInput ? jsonPinInput.value : "";
        if (jsonPinInput) jsonPinInput.value = "";
        var save = currentPortableSave();
        window.GitBlocks.sealPortableSave(save, pin).then(function (result) {
          if (!result.ok) {
            setJsonStatus(result.error);
            return;
          }
          downloadJson("branchborne-save.json", result.file);
          setJsonStatus(result.file.pin
            ? "Shipped branchborne-save.json. The file has a PIN hash, not the PIN."
            : "Shipped branchborne-save.json. This one has no PIN.");
        }).catch(function () {
          setJsonStatus("Could not ship that save.");
        });
      });
    }

    if (jsonFileInput) {
      jsonFileInput.addEventListener("change", function () {
        pendingPortable = null;
        showImportPin(false);
        var file = jsonFileInput.files && jsonFileInput.files[0];
        if (!file) return;
        if (file.size > 200000) {
          setJsonStatus("That file is too big to be a Branchborne save.");
          jsonFileInput.value = "";
          return;
        }
        var reader = new FileReader();
        reader.onload = function () {
          var parsed;
          try {
            parsed = JSON.parse(String(reader.result || ""));
          } catch (_err) {
            setJsonStatus("That file is not JSON. Ship a save from this cabinet first.");
            return;
          }
          var inspected = window.GitBlocks.inspectPortableSave(parsed);
          if (!inspected.ok) {
            setJsonStatus(inspected.error);
            return;
          }
          pendingPortable = parsed;
          if (inspected.pin) {
            showImportPin(true);
            setJsonStatus("This save has a PIN. Enter it, then open the file in the game.");
            return;
          }
          setJsonStatus("This save has no PIN. Open it to restore the quest.");
        };
        reader.onerror = function () {
          setJsonStatus("That file could not be read.");
        };
        reader.readAsText(file);
      });
    }

    var importBtn = root.querySelector("[data-json-import]");
    if (importBtn) {
      importBtn.addEventListener("click", function () {
        if (!pendingPortable) {
          setJsonStatus("Choose a branchborne-save.json file first.");
          return;
        }
        var pin = pendingNeedsPin && jsonImportPin ? jsonImportPin.value : "";
        clearImportPin();
        window.GitBlocks.unlockPortableSave(pendingPortable, pin).then(function (result) {
          applyPortableSave(result);
        }).catch(function () {
          setJsonStatus("That file could not be opened.");
        });
      });
    }

    refreshJsonLesson();

    function readSession() {
      try {
        var raw = sessionStorage.getItem(SESSION_KEY);
        if (!raw) return null;
        return sessionFromToken(JSON.parse(raw));
      } catch (_err) {
        return null;
      }
    }

    function writeSession(next) {
      session = sessionFromToken(next);
      if (!session) {
        sessionStorage.removeItem(SESSION_KEY);
        return null;
      }
      sessionStorage.setItem(
        SESSION_KEY,
        JSON.stringify({
          access_token: session.accessToken,
          refresh_token: session.refreshToken,
          expiresAt: session.expiresAt,
        })
      );
      return session;
    }

    function sessionFromToken(value) {
      if (!value || typeof value.access_token !== "string") return null;
      var payload = sec.decodeJwtPayload(value.access_token);
      if (!payload || payload.role !== "authenticated" || !sec.isUuid(payload.sub)) return null;
      return {
        id: payload.sub.toLowerCase(),
        accessToken: value.access_token,
        refreshToken: typeof value.refresh_token === "string" ? value.refresh_token : "",
        expiresAt: Number(value.expiresAt) || Date.now() + Number(value.expires_in || 3600) * 1000,
      };
    }

    function authHeaders(token, prefer) {
      var headers = { apikey: config.key, "content-type": "application/json" };
      if (token) headers.authorization = "Bearer " + token;
      if (prefer) headers.prefer = prefer;
      return headers;
    }

    function authFetch(path, options) {
      return fetch(config.url + path, {
        method: options.method || "GET",
        headers: authHeaders(options.token, options.prefer),
        body: options.body ? JSON.stringify(options.body) : undefined,
        credentials: "omit",
      }).then(function (response) {
        return response.json().catch(function () { return null; }).then(function (payload) {
          return { ok: response.ok, status: response.status, payload: payload };
        });
      });
    }

    function signature(save) {
      var canonical = window.GitBlocks.canonicalCloudSave(save);
      if (!canonical) return "";
      var ids = function (list) {
        return (list || [])
          .map(function (entry) { return entry.id; })
          .sort()
          .join(",");
      };
      return [
        canonical.pathwayId,
        canonical.level,
        canonical.score,
        canonical.moves,
        canonical.phase,
        canonical.status,
        canonical.bestScore,
        canonical.challengeIndex,
        canonical.levelScore,
        canonical.graduated ? 1 : 0,
        canonical.classExpert ? 1 : 0,
        ids(canonical.trophies),
        ids(canonical.loot),
        ids(canonical.skills),
      ].join("|");
    }

    function flushPush() {
      if (!config || !session || !pending) return;
      if (typeof root._branchborneScope === "function" && root._branchborneScope() !== session.id) return;
      var save = pending;
      pending = null;
      var row = window.GitBlocks.toPlayerSaveRow(session.id, save);
      if (row.user_id && row.user_id !== session.id) return;
      authFetch("/rest/v1/branchborne_saves?on_conflict=user_id", {
        method: "POST",
        token: session.accessToken,
        prefer: "resolution=merge-duplicates,return=minimal",
        body: row,
      })
        .then(function () {
          if (pending) flushPush();
        })
        .catch(function () {
          pending = save;
        });
    }

    root._branchborneCloudPush = function (save, reason) {
      if (!config || !session || !save) return;
      if (typeof root._branchborneScope === "function" && root._branchborneScope() !== session.id) return;
      pending = save;
      var immediate = reason === "pause" || reason === "end" || reason === "trophy";
      window.clearTimeout(pushTimer);
      if (immediate) flushPush();
      else pushTimer = window.setTimeout(flushPush, 450);
    };

    function applyRemote(row) {
      if (!game || !session) return;
      if (String(row.user_id || "").toLowerCase() !== session.id) return;
      var local = typeof root._branchborneReadProgress === "function" ? root._branchborneReadProgress() : null;
      var merged = window.GitBlocks.mergeCloudSaves(local, row);
      if (game.status === "playing") {
        pending = window.GitBlocks.cloudSaveFromSnapshot(game.snapshot(), merged.bestScore);
        flushPush();
        return;
      }
      if (signature(merged) !== signature(row)) merged.updatedAt = new Date().toISOString();
      game.restoreCloudSave(merged);
      if (typeof root._branchborneRemember === "function") root._branchborneRemember(merged);
      if (signature(merged) !== signature(row)) {
        pending = merged;
        flushPush();
      }
    }

    function pull() {
      if (!config || !session) return;
      authFetch(
        "/rest/v1/branchborne_saves?select=user_id,pathway_id,level,quest_title,score,moves,phase,status,high_score,trophies,items,skills,challenge_index,level_score,graduated,class_expert,challenges_cleared,updated_at&user_id=eq." +
          session.id,
        { token: session.accessToken }
      )
        .then(function (result) {
          if (!result.ok) return;
          var row = Array.isArray(result.payload) ? result.payload[0] : null;
          if (!row) return;
          applyRemote(row);
        })
        .catch(function () {
          return null;
        });
    }

    function onSession(next) {
      session = next;
      if (session && typeof root._branchborneSetScope === "function") root._branchborneSetScope(session.id);
      if (session) {
        pull();
        return;
      }
      if (typeof root._branchborneSetScope === "function") root._branchborneSetScope(null);
    }

    function consumeUrlSession() {
      var hash = new URLSearchParams(location.hash.replace(/^#/, ""));
      var access = hash.get("access_token");
      if (access) {
        var next = writeSession({
          access_token: access,
          refresh_token: hash.get("refresh_token") || "",
          expires_in: hash.get("expires_in") || 3600,
        });
        history.replaceState(null, "", location.pathname + location.search);
        return next;
      }
      var code = new URLSearchParams(location.search).get("code");
      var verifier = sessionStorage.getItem(PKCE_KEY);
      if (!code || !verifier || !config) return null;
      sessionStorage.removeItem(PKCE_KEY);
      history.replaceState(null, "", location.pathname);
      return authFetch("/auth/v1/token?grant_type=pkce", {
        method: "POST",
        body: { auth_code: code, code_verifier: verifier },
      }).then(function (result) {
        if (!result.ok) return null;
        return writeSession(result.payload || {});
      });
    }

    function enableCloud(next) {
      config = next;
      Promise.resolve(consumeUrlSession()).then(function (fromUrl) {
        onSession(fromUrl || readSession());
      });
    }

    function configFromBody(data) {
      if (!data || typeof data !== "object") return null;
      if (data.enabled === false) return null;
      var url = typeof data.url === "string" ? data.url.replace(/\/$/, "") : "";
      var key = data.key || data.anonKey || "";
      if (!sec.isSupabaseProjectUrl(url) || !sec.isPublishableKey(key)) return null;
      return { url: url, key: key };
    }

    fetch("/api/public-config", { headers: { accept: "application/json" }, credentials: "omit", cache: "no-store" })
      .then(function (response) {
        if (!response.ok) throw new Error("missing");
        return response.json();
      })
      .then(function (body) {
        var parsed = configFromBody(body);
        if (!parsed) throw new Error("disabled");
        return parsed;
      })
      .catch(function () {
        return fetch("./supabase-public.json", { headers: { accept: "application/json" }, credentials: "omit" }).then(function (response) {
          if (!response.ok) throw new Error("missing file");
          return response.json();
        }).then(configFromBody);
      })
      .then(function (parsed) {
        if (parsed) enableCloud(parsed);
      })
      .catch(function () {
        return null;
      });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
