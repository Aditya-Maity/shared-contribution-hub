import { deleteCookie, getCookie, setCookie } from "@tanstack/react-start/server";
import { db } from "./db.server";
import { randomToken, sha256 } from "./password";

const COOKIE = "fitlog_session";
const MAX_AGE_S = 60 * 60 * 24 * 30;

export type SessionUser = { id: string; email: string; displayName: string };

export async function startSession(userId: string) {
  const token = randomToken();
  await db()`INSERT INTO sessions (token_hash, user_id, expires_at)
             VALUES (${await sha256(token)}, ${userId}, now() + make_interval(secs => ${MAX_AGE_S}))`;
  setCookie(COOKIE, token, {
    httpOnly: true,
    secure: process.env["NODE_ENV"] === "production" || process.env["COOKIE_SECURE"] === "true",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_S,
  });
}

export async function currentUser(): Promise<SessionUser | null> {
  const token = getCookie(COOKIE);
  if (!token) return null;
  const rows = await db()`SELECT u.id, u.email, u.display_name
    FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ${await sha256(token)} AND s.expires_at > now()`;
  const r = rows[0];
  return r ? { id: r.id, email: r.email, displayName: r.display_name } : null;
}

export async function endSession() {
  const token = getCookie(COOKIE);
  if (token) await db()`DELETE FROM sessions WHERE token_hash = ${await sha256(token)}`;
  deleteCookie(COOKIE, { path: "/" });
}
