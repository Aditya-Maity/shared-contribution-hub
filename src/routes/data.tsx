import { createFileRoute } from "@tanstack/react-router";
import { Screen } from "@/components/Screen";
import html from "@/screens/data.html?raw";
import script from "@/screens/data.script.txt?raw";

export const Route = createFileRoute("/data")({
  head: () => ({
    meta: [
      { title: "FitLog — History & Data" },
      { name: "description", content: "Review your nutrition and training history over time." },
      { property: "og:title", content: "FitLog — History & Data" },
      { property: "og:description", content: "Review your nutrition and training history over time." },
    ],
  }),
  component: () => <Screen key="data" html={html} script={script} />,
});
