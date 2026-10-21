import postgres from "postgres";

let client: ReturnType<typeof postgres> | undefined;

// Lazily connect so DATABASE_URL is read at request time, never at module load.
export function db() {
  if (!client) {
    const url = process.env["DATABASE_URL"];
    if (!url) throw new Error("DATABASE_URL is not configured on the server.");
    client = postgres(url, { max: 5, idle_timeout: 20, prepare: false });
  }
  return client;
}

/** Run queries with row-level security scoped to one user. */
export function asUser<T>(userId: string, fn: (tx: postgres.TransactionSql) => Promise<T>) {
  return db().begin(async (tx) => {
    await tx`SELECT set_config('app.user_id', ${userId}, true)`;
    return fn(tx);
  }) as Promise<T>;
}
