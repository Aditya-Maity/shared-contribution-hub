import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireUser } from "./auth.functions";

export type Log = {
  id: string;
  kind: "meal" | "workout";
  title: string;
  notes: string | null;
  calories: number | null;
  protein: number | null;
  duration_min: number | null;
  log_date: string;
};

export const logInput = z.object({
  kind: z.enum(["meal", "workout"]),
  title: z.string().trim().min(1).max(120),
  notes: z.string().trim().max(1000).nullable(),
  calories: z.number().int().min(0).max(20000).nullable(),
  protein: z.number().min(0).max(2000).nullable(),
  duration_min: z.number().int().min(0).max(1440).nullable(),
  log_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const COLS = "id, kind, title, notes, calories, protein::float8 AS protein, duration_min, to_char(log_date, 'YYYY-MM-DD') AS log_date";

export const listMyLogs = createServerFn({ method: "GET" })
  .middleware([requireUser])
  .handler(async ({ context }) => {
    const { asUser } = await import("@/server/db.server");
    return asUser(context.user.id, async (tx) =>
      (await tx.unsafe(`SELECT ${COLS} FROM logs WHERE user_id = $1 ORDER BY log_date DESC, created_at DESC LIMIT 500`, [context.user.id])) as unknown as Log[],
    );
  });

export const createLog = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .inputValidator((d: unknown) => logInput.parse(d))
  .handler(async ({ context, data }) => {
    const { asUser } = await import("@/server/db.server");
    await asUser(context.user.id, (tx) => tx`INSERT INTO logs ${tx({ ...data, user_id: context.user.id })}`);
    return { ok: true };
  });

export const updateLog = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .inputValidator((d: unknown) => logInput.extend({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { asUser } = await import("@/server/db.server");
    const { id, ...fields } = data;
    const res = await asUser(context.user.id, (tx) =>
      tx`UPDATE logs SET ${tx(fields)}, updated_at = now() WHERE id = ${id} AND user_id = ${context.user.id}`,
    );
    if (res.count === 0) throw new Error("Log not found.");
    return { ok: true };
  });

export const deleteLog = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { asUser } = await import("@/server/db.server");
    const res = await asUser(context.user.id, (tx) => tx`DELETE FROM logs WHERE id = ${data.id} AND user_id = ${context.user.id}`);
    if (res.count === 0) throw new Error("Log not found.");
    return { ok: true };
  });
