import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Kind = "meal" | "workout";
type Draft = { kind: Kind; title: string; notes: string; calories: string; protein: string; duration_min: string; log_date: string };

const today = () => new Date().toISOString().slice(0, 10);
const empty = (): Draft => ({ kind: "meal", title: "", notes: "", calories: "", protein: "", duration_min: "", log_date: today() });

const feedQuery = queryOptions({
  queryKey: ["contributions"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("contributions")
      .select("*, profiles(display_name)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return data;
  },
});

export const Route = createFileRoute("/_authenticated/community")({
  head: () => ({
    meta: [
      { title: "FitLog — Community Log" },
      { name: "description", content: "Share your meals and workouts and see what the FitLog community is logging." },
      { property: "og:title", content: "FitLog — Community Log" },
      { property: "og:description", content: "Share your meals and workouts and see what the FitLog community is logging." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(feedQuery),
  component: CommunityPage,
});

const field = "w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-on-surface outline-none focus:border-primary";
const num = (v: string) => (v.trim() === "" ? null : Number(v));

function CommunityPage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: items } = useSuspenseQuery(feedQuery);
  const [draft, setDraft] = useState<Draft>(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "mine">("all");
  const [error, setError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: async (d: Draft) => {
      const row = {
        kind: d.kind,
        title: d.title.trim(),
        notes: d.notes.trim() || null,
        calories: num(d.calories),
        protein: d.kind === "meal" ? num(d.protein) : null,
        duration_min: d.kind === "workout" ? num(d.duration_min) : null,
        log_date: d.log_date,
      };
      const res = editingId
        ? await supabase.from("contributions").update(row).eq("id", editingId)
        : await supabase.from("contributions").insert({ ...row, user_id: user.id });
      if (res.error) throw res.error;
    },
    onSuccess: () => {
      setDraft(empty());
      setEditingId(null);
      setError(null);
      qc.invalidateQueries({ queryKey: ["contributions"] });
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Could not save"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contributions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contributions"] }),
  });

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const shown = filter === "mine" ? items.filter((i) => i.user_id === user.id) : items;

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="max-w-5xl mx-auto h-16 px-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-container text-3xl">fitness_center</span>
            <span className="text-xl font-bold">FitLog</span>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <Link to="/" className="px-3 py-2 rounded-xl text-on-surface-variant hover:bg-surface-container-high">Home</Link>
            <Link to="/entry" className="px-3 py-2 rounded-xl text-on-surface-variant hover:bg-surface-container-high">Entry</Link>
            <Link to="/data" className="px-3 py-2 rounded-xl text-on-surface-variant hover:bg-surface-container-high">Data</Link>
            <span className="px-3 py-2 rounded-xl bg-surface-container-high font-bold">Community</span>
            <button onClick={signOut} className="ml-2 px-3 py-2 rounded-xl border border-outline-variant hover:bg-surface-container-high">Sign out</button>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 grid gap-8 lg:grid-cols-[360px_1fr]">
        <section className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_1px_8px_rgba(0,0,0,0.04)] h-fit lg:sticky lg:top-24">
          <h2 className="text-lg font-bold mb-4">{editingId ? "Edit your log" : "Share a log"}</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate(draft);
            }}
            className="flex flex-col gap-3"
          >
            <div className="grid grid-cols-2 gap-1 bg-surface-container-low p-1 rounded-xl">
              {(["meal", "workout"] as const).map((k) => (
                <button type="button" key={k} onClick={() => setDraft({ ...draft, kind: k })}
                  className={`py-2 rounded-lg text-sm font-semibold capitalize ${draft.kind === k ? "bg-surface-container-lowest shadow-sm" : "text-on-surface-variant"}`}>
                  {k}
                </button>
              ))}
            </div>
            <input className={field} required maxLength={120} placeholder={draft.kind === "meal" ? "e.g. Salmon & rice bowl" : "e.g. Push day, 5×5 bench"}
              value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <input className={field} type="number" min={0} max={20000} placeholder={draft.kind === "meal" ? "Calories" : "Calories burned"}
                value={draft.calories} onChange={(e) => setDraft({ ...draft, calories: e.target.value })} />
              {draft.kind === "meal" ? (
                <input className={field} type="number" min={0} max={2000} step="0.1" placeholder="Protein (g)"
                  value={draft.protein} onChange={(e) => setDraft({ ...draft, protein: e.target.value })} />
              ) : (
                <input className={field} type="number" min={0} max={1440} placeholder="Minutes"
                  value={draft.duration_min} onChange={(e) => setDraft({ ...draft, duration_min: e.target.value })} />
              )}
            </div>
            <input className={field} type="date" required value={draft.log_date} onChange={(e) => setDraft({ ...draft, log_date: e.target.value })} />
            <textarea className={field} rows={3} maxLength={1000} placeholder="Notes (optional)"
              value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
            <button disabled={save.isPending} className="bg-primary text-on-primary font-semibold py-3 rounded-xl hover:opacity-90 disabled:opacity-50">
              {save.isPending ? "Saving…" : editingId ? "Save changes" : "Post log"}
            </button>
            {editingId && (
              <button type="button" onClick={() => { setEditingId(null); setDraft(empty()); }} className="text-sm text-on-surface-variant hover:text-on-surface">
                Cancel editing
              </button>
            )}
            {error && <p className="text-sm text-error">{error}</p>}
          </form>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Community Log</h1>
            <div className="flex gap-1 bg-surface-container-low p-1 rounded-xl text-sm">
              {(["all", "mine"] as const).map((f) => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg font-semibold ${filter === f ? "bg-surface-container-lowest shadow-sm" : "text-on-surface-variant"}`}>
                  {f === "all" ? "Everyone" : "Mine"}
                </button>
              ))}
            </div>
          </div>
          {shown.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-2xl p-10 text-center text-on-surface-variant">
              No logs yet — share your first meal or workout.
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {shown.map((c) => {
                const mine = c.user_id === user.id;
                return (
                  <li key={c.id} className="bg-surface-container-lowest rounded-2xl p-5 shadow-[0_1px_8px_rgba(0,0,0,0.04)] flex gap-4">
                    <span className={`material-symbols-outlined w-11 h-11 shrink-0 rounded-xl flex items-center justify-center ${c.kind === "meal" ? "bg-primary/10 text-primary" : "bg-surface-container-high text-on-surface"}`}>
                      {c.kind === "meal" ? "restaurant" : "fitness_center"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{c.title}</p>
                          <p className="text-xs text-on-surface-variant">
                            {mine ? "You" : c.profiles?.display_name ?? "Athlete"} · {new Date(c.log_date + "T00:00:00").toLocaleDateString()}
                          </p>
                        </div>
                        {mine && (
                          <div className="flex gap-1 shrink-0">
                            <button aria-label="Edit" className="p-1.5 rounded-lg hover:bg-surface-container-high" onClick={() => {
                              setEditingId(c.id);
                              setDraft({
                                kind: c.kind as Kind, title: c.title, notes: c.notes ?? "",
                                calories: c.calories?.toString() ?? "", protein: c.protein?.toString() ?? "",
                                duration_min: c.duration_min?.toString() ?? "", log_date: c.log_date,
                              });
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}>
                              <span className="material-symbols-outlined text-lg">edit</span>
                            </button>
                            <button aria-label="Delete" className="p-1.5 rounded-lg hover:bg-surface-container-high text-error"
                              onClick={() => confirm("Delete this log?") && remove.mutate(c.id)}>
                              <span className="material-symbols-outlined text-lg">delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2 text-xs">
                        {c.calories != null && <span className="px-2 py-1 rounded-full bg-surface-container-low">{c.calories} kcal</span>}
                        {c.protein != null && <span className="px-2 py-1 rounded-full bg-surface-container-low">{c.protein} g protein</span>}
                        {c.duration_min != null && <span className="px-2 py-1 rounded-full bg-surface-container-low">{c.duration_min} min</span>}
                      </div>
                      {c.notes && <p className="text-sm text-on-surface-variant mt-2 whitespace-pre-wrap">{c.notes}</p>}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
