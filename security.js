/**
 * Browser-safe helpers for Branchborne Gem Quest.
 * No secrets live here. Callers must not send a service-role key to the page.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.BranchborneSecurity = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const RECORD_ID_RE = /^[a-z0-9][a-z0-9_-]{0,63}$/;
  const HEX_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
  const CSS_LAYER_RE =
    /^(?:#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})|(?:rgb|rgba|hsl|hsla|linear-gradient|radial-gradient|repeating-linear-gradient|repeating-radial-gradient)\([#a-zA-Z0-9\s.,%+\-:/()]+\))$/;

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function isUuid(value) {
    return typeof value === "string" && UUID_RE.test(value);
  }

  function storageKey(base, userId) {
    if (typeof base !== "string" || !/^[a-z0-9-]{1,48}$/.test(base)) return "git-blocks-rejected:guest";
    if (isUuid(userId)) return `${base}:u:${userId.toLowerCase()}`;
    return `${base}:guest`;
  }

  function safeRecordId(value) {
    const text = String(value || "");
    return RECORD_ID_RE.test(text) ? text : "";
  }

  function plainLabel(value, max) {
    const limit = max == null ? 80 : max;
    const text = String(value == null ? "" : value)
      .replace(/[\u0000-\u001F\u007F<>]/g, "")
      .trim();
    return text.slice(0, limit);
  }

  function sanitizeDisplayName(value) {
    const text = plainLabel(value, 32);
    if (!text) return "";
    return text;
  }

  function isValidEmail(value) {
    if (typeof value !== "string") return false;
    const email = value.trim();
    if (email.length < 3 || email.length > 254) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function passwordError(value) {
    if (typeof value !== "string" || !value) return "Enter a password.";
    if (value.length < 8) return "Use at least 8 characters.";
    if (value.length > 72) return "Use at most 72 characters.";
    return "";
  }

  function safeHex(value, fallback) {
    return HEX_RE.test(value || "") ? value : fallback;
  }

  function splitCssLayers(value) {
    const parts = [];
    let depth = 0;
    let start = 0;
    for (let i = 0; i < value.length; i += 1) {
      const ch = value[i];
      if (ch === "(") depth += 1;
      else if (ch === ")") depth = Math.max(0, depth - 1);
      else if (ch === "," && depth === 0) {
        parts.push(value.slice(start, i).trim());
        start = i + 1;
      }
    }
    parts.push(value.slice(start).trim());
    return parts.filter(Boolean);
  }

  function sanitizeCssBackground(css) {
    if (typeof css !== "string") return "";
    const trimmed = css.trim().slice(0, 600);
    if (!trimmed) return "";
    if (/url\s*\(|expression\s*\(|@|javascript:|data:|<|>|[{};]|\\/i.test(trimmed)) return "";
    if (!/^[#a-zA-Z0-9\s.,()%+\-:/]+$/.test(trimmed)) return "";
    const layers = splitCssLayers(trimmed);
    if (!layers.length || layers.some((layer) => !CSS_LAYER_RE.test(layer))) return "";
    return trimmed;
  }

  function sanitizeHttpsUrl(value) {
    if (typeof value !== "string") return "";
    const trimmed = value.trim();
    if (!trimmed || trimmed.length > 400) return "";
    if (/[\s"'()\\<>]/.test(trimmed)) return "";
    let url;
    try {
      url = new URL(trimmed);
    } catch (_err) {
      return "";
    }
    if (url.protocol !== "https:") return "";
    if (url.username || url.password) return "";
    if (!/^https:\/\/[^\s"'()\\<>]+$/.test(url.href)) return "";
    return url.href;
  }

  function sanitizeTrackId(value) {
    const text = String(value || "");
    return /^[a-z0-9-]{1,40}$/.test(text) ? text : "";
  }

  function clampVolume(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return 0.38;
    return Math.min(1, Math.max(0, n));
  }

  function safeShareBase(candidate, fallback) {
    const base = typeof fallback === "string" ? fallback : "";
    if (!candidate || typeof candidate !== "string") return base;
    try {
      const url = new URL(candidate, base || undefined);
      if (url.username || url.password) return base;
      if (url.protocol !== "http:" && url.protocol !== "https:") return base;
      if (base) {
        const expected = new URL(base);
        if (url.origin !== expected.origin) return base;
      }
      return `${url.origin}${url.pathname}`;
    } catch (_err) {
      return base;
    }
  }

  function decodeJwtPayload(token) {
    if (typeof token !== "string") return null;
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    try {
      const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      const padded = b64 + "===".slice((b64.length + 3) % 4);
      const json = typeof atob === "function" ? atob(padded) : "";
      return JSON.parse(json);
    } catch (_err) {
      return null;
    }
  }

  function isPublishableKey(key) {
    if (typeof key !== "string") return false;
    const trimmed = key.trim();
    if (!trimmed || trimmed.length > 2000) return false;
    if (/^sb_secret_/i.test(trimmed)) return false;
    if (/^sb_publishable_[A-Za-z0-9_-]+$/.test(trimmed)) return true;
    const payload = decodeJwtPayload(trimmed);
    return Boolean(payload && payload.role === "anon");
  }

  function isSupabaseProjectUrl(value) {
    if (typeof value !== "string") return false;
    try {
      const url = new URL(value);
      if (url.protocol !== "https:") return false;
      if (url.username || url.password) return false;
      if (url.pathname !== "/" && url.pathname !== "") return false;
      return /^[a-z0-9-]+\.supabase\.co$/i.test(url.hostname);
    } catch (_err) {
      return false;
    }
  }

  return {
    escapeHtml,
    isUuid,
    storageKey,
    safeRecordId,
    plainLabel,
    sanitizeDisplayName,
    isValidEmail,
    passwordError,
    safeHex,
    sanitizeCssBackground,
    sanitizeHttpsUrl,
    sanitizeTrackId,
    clampVolume,
    safeShareBase,
    decodeJwtPayload,
    isPublishableKey,
    isSupabaseProjectUrl,
  };
});
