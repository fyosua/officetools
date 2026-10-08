import { Cookie } from "elysia";

const COOKIE_NAME = "session";
const COOKIE_MAX_AGE = 86400; // 24 hours

function sign(value: string, secret: string): string {
  const hmac = new Bun.CryptoHasher("sha256", secret);
  hmac.update(value);
  return value + "." + hmac.digest("hex");
}

function verify(token: string, secret: string): string | null {
  const dot = token.lastIndexOf(".");
  if (dot === -1) return null;
  const value = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = new Bun.CryptoHasher("sha256", secret).update(value).digest("hex");
  return sig === expected ? value : null;
}

export function createSessionCookie(secret: string): Record<string, string> {
  const payload = JSON.stringify({ auth: true, ts: Date.now() });
  const token = sign(payload, secret);
  return {
    [COOKIE_NAME]: token,
    "Max-Age": String(COOKIE_MAX_AGE),
    Path: "/",
    HttpOnly: "true",
    SameSite: "Lax",
  };
}

export function verifySession(cookie: string | undefined, secret: string): boolean {
  if (!cookie) return false;
  const payload = verify(cookie, secret);
  if (!payload) return false;
  try {
    const data = JSON.parse(payload);
    return data.auth === true;
  } catch {
    return false;
  }
}

export function clearSessionCookie(): Record<string, string> {
  return {
    [COOKIE_NAME]: "",
    "Max-Age": "0",
    Path: "/",
    HttpOnly: "true",
    SameSite: "Lax",
  };
}