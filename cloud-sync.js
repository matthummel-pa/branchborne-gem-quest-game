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
    var statusEl = root.querySelector("[data-account-status]");
    var form = root.querySelector("[data-account-form]");
    var userEl = root.querySelector("[data-account-user]");
    var signOutBtn = root.querySelector("[data-account-signout]");
    var panel = root.querySelector("[data-account-panel]");
    var openBtn = root.querySelector("[data-account]");
    var emailInput = root.querySelector("[data-account-email]");
    var passwordInput = root.querySelector("[data-account-password]");
    var config = null;
    var session = null;
    var pushTimer = 0;
    var pending = null;
    var authWired = false;

    function setStatus(text) {
      if (statusEl) statusEl.textContent = text ? String(text).slice(0, 180) : "";
    }

    function clearPassword() {
      if (passwordInput) passwordInput.value = "";
    }

    function safeAuthMessage(payload, password) {
      var msg = payload && (payload.msg || payload.error_description || payload.message || payload.error);
      var text = typeof msg === "string" ? msg : "";
      if (!text || (password && text.indexOf(password) !== -1)) {
        return "That did not work. Check the email and password.";
      }
      return text.slice(0, 180);
    }

    function showSignedIn(active) {
      var on = Boolean(active);
      if (form) form.hidden = on || !config;
      if (signOutBtn) signOutBtn.hidden = !on;
      if (userEl) {
        userEl.hidden = !on;
        userEl.textContent = on ? "Signed in as " + (active.email || "your account") : "";
      }
    }

    function togglePanel(forceOpen) {
      if (!panel) return;
      var open = typeof forceOpen === "boolean" ? forceOpen : panel.hidden;
      panel.hidden = !open;
      if (open) panel.removeAttribute("hidden");
      else panel.setAttribute("hidden", "");
      if (open) {
        var customize = root.querySelector("[data-customize-panel]");
        if (customize) {
          customize.hidden = true;
          customize.setAttribute("hidden", "");
          root.classList.remove("is-customizing");
        }
      }
    }

    if (openBtn) openBtn.addEventListener("click", function () { togglePanel(); });
    root.querySelectorAll("[data-account-close]").forEach(function (btn) {
      btn.addEventListener("click", function () { togglePanel(false); });
    });

    function redirectTo() {
      return location.origin + location.pathname;
    }

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
        email: typeof payload.email === "string" ? payload.email : "",
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
        .then(function (result) {
          if (!result.ok) setStatus(safeAuthMessage(result.payload, ""));
          else setStatus("Synced trophies and quest status.");
          if (pending) flushPush();
        })
        .catch(function () {
          setStatus("Saved in this browser for this account. Cloud sync is unreachable.");
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
          if (!result.ok) {
            setStatus("Signed in. Could not read your save.");
            return;
          }
          var row = Array.isArray(result.payload) ? result.payload[0] : null;
          if (!row) {
            setStatus("Signed in. Your next match, trophy, or pause will sync.");
            return;
          }
          applyRemote(row);
          setStatus("Synced trophies and quest status.");
        })
        .catch(function () {
          setStatus("Signed in. Cloud save is unreachable, so this account's browser copy is the fallback.");
        });
    }

    function onSession(next) {
      session = next;
      showSignedIn(session);
      if (session && typeof root._branchborneSetScope === "function") root._branchborneSetScope(session.id);
      if (session) {
        setStatus("Signed in. Syncing trophies and quest status…");
        pull();
        return;
      }
      if (typeof root._branchborneSetScope === "function") root._branchborneSetScope(null);
      setStatus("Sign in to sync trophies across browsers. Guest progress stays separate from accounts.");
    }

    function emailValue() {
      var email = emailInput ? emailInput.value.trim() : "";
      if (!sec.isValidEmail(email)) {
        setStatus("Enter a valid email address.");
        clearPassword();
        return "";
      }
      return email;
    }

    function passwordValue() {
      var password = passwordInput ? passwordInput.value : "";
      var problem = sec.passwordError(password);
      if (problem) {
        setStatus(problem);
        clearPassword();
        return "";
      }
      return password;
    }

    function randomVerifier() {
      var bytes = new Uint8Array(32);
      crypto.getRandomValues(bytes);
      var text = "";
      bytes.forEach(function (byte) { text += String.fromCharCode(byte); });
      return btoa(text).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
    }

    function challengeFor(verifier) {
      return crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier)).then(function (buf) {
        var bytes = new Uint8Array(buf);
        var text = "";
        bytes.forEach(function (byte) { text += String.fromCharCode(byte); });
        return btoa(text).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
      });
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

    function wireAuth() {
      if (authWired || !form) return;
      authWired = true;
      form.hidden = false;
      form.method = "post";
      form.action = "#account";
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var email = emailValue();
        if (!email || !config) return;
        var password = passwordInput ? passwordInput.value : "";
        var problem = sec.passwordError(password);
        if (problem) {
          setStatus(problem);
          clearPassword();
          return;
        }
        clearPassword();
        setStatus("Signing in…");
        authFetch("/auth/v1/token?grant_type=password", {
          method: "POST",
          body: { email: email, password: password },
        }).then(function (result) {
          clearPassword();
          if (!result.ok) {
            setStatus(safeAuthMessage(result.payload, password));
            return;
          }
          onSession(writeSession(result.payload || {}));
        });
      });
      var signup = root.querySelector("[data-account-signup]");
      if (signup) {
        signup.addEventListener("click", function () {
          var email = emailValue();
          if (!email || !config) return;
          var password = passwordValue();
          if (!password) return;
          clearPassword();
          setStatus("Creating account…");
          authFetch("/auth/v1/signup?redirect_to=" + encodeURIComponent(redirectTo()), {
            method: "POST",
            body: { email: email, password: password },
          }).then(function (result) {
            clearPassword();
            if (!result.ok) {
              setStatus(safeAuthMessage(result.payload, password));
              return;
            }
            var body = result.payload || {};
            var access = body.access_token || (body.session && body.session.access_token);
            if (access) onSession(writeSession(body.session || body));
            else setStatus("Check your email to confirm the account, then sign in. The password was not stored.");
          });
        });
      }
      var magic = root.querySelector("[data-account-magic]");
      if (magic) {
        magic.addEventListener("click", function () {
          var email = emailValue();
          if (!email || !config) return;
          clearPassword();
          var verifier = randomVerifier();
          sessionStorage.setItem(PKCE_KEY, verifier);
          setStatus("Sending a sign-in link…");
          challengeFor(verifier).then(function (challenge) {
            return authFetch("/auth/v1/otp?redirect_to=" + encodeURIComponent(redirectTo()), {
              method: "POST",
              body: {
                email: email,
                create_user: true,
                code_challenge: challenge,
                code_challenge_method: "s256",
              },
            });
          }).then(function (result) {
            if (!result.ok) setStatus(safeAuthMessage(result.payload, ""));
            else setStatus("Check your email for the sign-in link. It opens this cabinet.");
          });
        });
      }
      if (signOutBtn) {
        signOutBtn.addEventListener("click", function () {
          var token = session ? session.accessToken : "";
          session = null;
          pending = null;
          sessionStorage.removeItem(SESSION_KEY);
          if (typeof root._branchborneSetScope === "function") root._branchborneSetScope(null);
          showSignedIn(null);
          setStatus("Signed out. Guest progress stays separate from the account you left.");
          clearPassword();
          if (token && config) {
            authFetch("/auth/v1/logout", { method: "POST", token: token, body: { scope: "global" } });
          }
        });
      }
    }

    function enableCloud(next) {
      config = next;
      wireAuth();
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

    setStatus("Progress stays in this browser until cloud save is configured.");
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
        if (!parsed) {
          setStatus("Cloud save is off. Trophies and quest status stay in this browser.");
          return;
        }
        setStatus("Connecting cloud save…");
        enableCloud(parsed);
      })
      .catch(function () {
        setStatus("Cloud save is off. Trophies and quest status stay in this browser.");
      });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
