import { createMiddleware, createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const credentials = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
});
const signUpInput = credentials.extend({ displayName: z.string().trim().min(1).max(40) });

export const getCurrentUser = createServerFn({ method: "GET" }).handler(async () => {
  const { currentUser } = await import("@/server/session.server");
  return currentUser();
});

export const signUp = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => signUpInput.parse(d))
  .handler(async ({ data }) => {
    const { db } = await import("@/server/db.server");
    const { hashPassword } = await import("@/server/password");
    const { startSession } = await import("@/server/session.server");
    const hash = await hashPassword(data.password);
    const rows = await db()`INSERT INTO users (email, password_hash, display_name)
      VALUES (${data.email}, ${hash}, ${data.displayName})
      ON CONFLICT (email) DO NOTHING RETURNING id`;
    if (!rows[0]) throw new Error("An account with this email already exists.");
    await startSession(rows[0].id);
    return { ok: true };
  });

export const signIn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => credentials.parse(d))
  .handler(async ({ data }) => {
    const { db } = await import("@/server/db.server");
    const { verifyPassword } = await import("@/server/password");
    const { startSession } = await import("@/server/session.server");
    const rows = await db()`SELECT id, password_hash FROM users WHERE email = ${data.email}`;
    const ok = rows[0] ? await verifyPassword(data.password, rows[0].password_hash) : false;
    if (!rows[0] || !ok) throw new Error("Email or password is incorrect.");
    await startSession(rows[0].id);
    return { ok: true };
  });

export const signOut = createServerFn({ method: "POST" }).handler(async () => {
  const { endSession } = await import("@/server/session.server");
  await endSession();
  return { ok: true };
});

/** Rejects the call unless a valid session cookie is present. */
export const requireUser = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const { currentUser } = await import("@/server/session.server");
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized: please sign in.");
  return next({ context: { user } });
});
