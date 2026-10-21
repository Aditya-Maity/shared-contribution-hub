import { useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";

const PATHS: Record<string, "/" | "/entry" | "/data"> = { home: "/", entry: "/entry", data: "/data" };

export function Screen({ html, script }: { html: string; script: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      // Run the screen's original interactive behavior against the rendered markup.
      new Function(script)();
    } catch (e) {
      console.error(e);
    }
  }, [script]);

  const onClick = (e: React.MouseEvent) => {
    const t = e.target as HTMLElement;
    const link = t.closest("[data-path]") as HTMLElement | null;
    const to = link ? PATHS[link.dataset["path"] ?? ""] : undefined;
    if (to) {
      e.preventDefault();
      navigate({ to });
      return;
    }
    const btn = t.closest("button");
    if (btn && /^(add\s*)?(add entry|entry)$/i.test(btn.textContent?.trim() ?? "") && btn.closest("aside, header")) {
      navigate({ to: "/entry" });
    }
  };

  return (
    <div
      ref={ref}
      onClick={onClick}
      className="bg-background font-body-md text-on-surface min-h-screen"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
