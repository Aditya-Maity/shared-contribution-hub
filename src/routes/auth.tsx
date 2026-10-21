import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Search = { redirect?: string };

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    redirect: typeof s["redirect"] === "string" && s["redirect"].startsWith("/") && !s["redirect"].startsWith("//") ? s["redirect"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "FitLog — Sign in" },
      { name: "description", content: "Sign in or create a FitLog account to share your meals and workouts." },
      { property: "og:title", content: "FitLog — Sign in" },
      { property: "og:description", content: "Sign in or create a FitLog account to share your meals and workouts." },
    ],
  }),
  component: AuthPage,
});

const input = "w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 text-on-surface outline-none focus:border-primary";

function AuthPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up" | "forgot">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      if (mode === "up") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/community", data: { display_name: name.trim() } },
        });
        if (error) throw error;
        if (data.session) navigate({ to: redirect ?? "/community" });
        else setMsg({ ok: true, text: "Check your email to confirm your account, then sign in." });
      } else if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: redirect ?? "/community" });
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + "/reset-password" });
        if (error) throw error;
        setMsg({ ok: true, text: "If that email has an account, a reset link is on its way." });
      }
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : "Something went wrong" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-[0_1px_8px_rgba(0,0,0,0.06)] p-8">
        <Link to="/" className="flex items-center gap-2 mb-6">
          <span className="material-symbols-outlined text-primary-container text-3xl">fitness_center</span>
          <span className="text-2xl font-bold text-on-surface">FitLog</span>
        </Link>
        <h1 className="text-xl font-bold text-on-surface mb-1">
          {mode === "up" ? "Create your account" : mode === "in" ? "Welcome back" : "Reset your password"}
        </h1>
        <p className="text-on-surface-variant text-sm mb-6">Share meals and workouts with the FitLog community.</p>
        <form onSubmit={submit} className="flex flex-col gap-3">
          {mode === "up" && (
            <input className={input} placeholder="Display name" required maxLength={40} value={name} onChange={(e) => setName(e.target.value)} />
          )}
          <input className={input} type="email" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          {mode !== "forgot" && (
            <input className={input} type="password" placeholder="Password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
          )}
          <button disabled={busy} className="mt-2 bg-primary text-on-primary font-semibold py-3 rounded-xl hover:opacity-90 disabled:opacity-50">
            {busy ? "Please wait…" : mode === "up" ? "Sign up" : mode === "in" ? "Sign in" : "Send reset link"}
          </button>
        </form>
        {msg && <p className={`mt-4 text-sm ${msg.ok ? "text-primary" : "text-error"}`}>{msg.text}</p>}
        <div className="mt-6 flex justify-between text-sm text-on-surface-variant">
          {mode === "in" ? (
            <>
              <button onClick={() => setMode("up")} className="hover:text-primary">Create account</button>
              <button onClick={() => setMode("forgot")} className="hover:text-primary">Forgot password?</button>
            </>
          ) : (
            <button onClick={() => setMode("in")} className="hover:text-primary">Back to sign in</button>
          )}
        </div>
      </div>
    </div>
  );
}
