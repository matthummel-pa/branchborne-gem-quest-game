declare const Netlify: {
  env: {
    get(name: string): string | undefined;
  };
};

function decodeJwtPayload(token: string): { role?: string } | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "===".slice((b64.length + 3) % 4);
    return JSON.parse(atob(padded)) as { role?: string };
  } catch (_err) {
    return null;
  }
}

function isPublishableKey(key: string): boolean {
  const trimmed = key.trim();
  if (!trimmed || trimmed.length > 2000) return false;
  if (/^sb_secret_/i.test(trimmed)) return false;
  const payload = decodeJwtPayload(trimmed);
  if (payload && payload.role === "service_role") return false;
  if (/^sb_publishable_[A-Za-z0-9_-]+$/.test(trimmed)) return true;
  return Boolean(payload && payload.role === "anon");
}

function isSupabaseProjectUrl(value: string): boolean {
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

function json(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}

export default async (req: Request): Promise<Response> => {
  if (req.method !== "GET") {
    return json({ error: "Method not allowed" }, 405);
  }

  const url = (Netlify.env.get("SUPABASE_URL") || "").trim();
  const publishable = Netlify.env.get("SUPABASE_PUBLISHABLE_KEY") || "";
  const anon = Netlify.env.get("SUPABASE_ANON_KEY") || "";
  const key = (publishable || anon).trim();
  const enabled = isSupabaseProjectUrl(url) && isPublishableKey(key);

  return json(
    {
      enabled,
      url: enabled ? url.replace(/\/$/, "") : "",
      key: enabled ? key : "",
      keyType: enabled ? (publishable ? "publishable" : "anon") : "",
    },
    200
  );
};

export const config = {
  path: "/api/public-config",
  method: "GET",
};
