import { createFileRoute } from "@tanstack/react-router";
import { Screen } from "@/components/Screen";
import html from "@/screens/home.html?raw";
import script from "@/screens/home.script.txt?raw";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FitLog — Daily Dashboard" },
      { name: "description", content: "Track your daily gym sessions, calories and macros at a glance." },
      { property: "og:title", content: "FitLog — Daily Dashboard" },
      { property: "og:description", content: "Track your daily gym sessions, calories and macros at a glance." },
    ],
  }),
  component: () => <Screen key="home" html={html} script={script} />,
});
