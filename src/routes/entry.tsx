import { createFileRoute } from "@tanstack/react-router";
import { Screen } from "@/components/Screen";
import html from "@/screens/entry.html?raw";
import script from "@/screens/entry.script.txt?raw";

export const Route = createFileRoute("/entry")({
  head: () => ({
    meta: [
      { title: "FitLog — Log Entry" },
      { name: "description", content: "Log meals, portions and workouts for today." },
      { property: "og:title", content: "FitLog — Log Entry" },
      { property: "og:description", content: "Log meals, portions and workouts for today." },
    ],
  }),
  component: () => <Screen key="entry" html={html} script={script} />,
});
