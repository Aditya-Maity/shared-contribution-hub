import { useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";

const PATHS: Record<string, "/" | "/entry" | "/data" | "/community"> = {
  home: "/",
  entry: "/entry",
  data: "/data",
  community: "/community",
};

const INACTIVE =
  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface font-label-lg text-label-lg transition-colors";

// Add a "Community" link after every "Data" link in the original screen menus.
function withCommunityLink(html: string) {
  return html.replace(/<a [^>]*data-path="data"[^>]*>[\s\S]*?<\/a>/g, (m) =>
    m +
    `<a class="${INACTIVE}" data-path="community" href="/community"><span class="material-symbols-outlined text-2xl">groups</span><span>Community</span></a>`,
  );
}

export function Screen({ html: rawHtml, script }: { html: string; script: string }) {
  const html = withCommunityLink(rawHtml);
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
