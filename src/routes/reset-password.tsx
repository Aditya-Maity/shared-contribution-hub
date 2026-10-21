import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "FitLog — Set a new password" },
      { name: "description", content: "Choose a new password for your FitLog account." },
      { property: "og:title", content: "FitLog — Set a new password" },
      { property: "og:description", content: "Choose a new password for your FitLog account." },
    ],
  }),
  component: ResetPage,
});

function ResetPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return setErr(error.message);
    navigate({ to: "/community" });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <form onSubmit={submit} className="w-full max-w-md bg-surface-container-lowest rounded-2xl p-8 flex flex-col gap-3 shadow-[0_1px_8px_rgba(0,0,0,0.06)]">
        <h1 className="text-xl font-bold text-on-surface">Set a new password</h1>
        <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password"
          className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 text-on-surface outline-none focus:border-primary" />
        <button className="bg-primary text-on-primary font-semibold py-3 rounded-xl">Save password</button>
        {err && <p className="text-sm text-error">{err}</p>}
      </form>
    </div>
  );
}
