import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Family Finance Tracker" },
      { name: "description", content: "Track income, expenses, savings, assets, and vouchers." },
      { property: "og:title", content: "Family Finance Tracker" },
      { property: "og:description", content: "Track income, expenses, savings, assets, and vouchers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Family Finance Tracker
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Blank project ready for income, expense, saving, asset, and voucher tracking.
        </p>
      </div>
    </div>
  );
}
