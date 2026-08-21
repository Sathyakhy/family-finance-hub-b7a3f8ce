import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Wallet, Settings, LogOut, TrendingDown, Landmark, Menu, ReceiptText } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: DashboardLayout,
});

function DashboardLayout() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("theme") as "light" | "dark") || "light";
    }
    return "light";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="flex h-[var(--app-height,100dvh)] w-full flex-col bg-muted/40 overflow-hidden pt-[env(safe-area-inset-top)]">
      {/* Top Navigation */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b bg-card px-4 lg:px-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 font-black italic tracking-tighter text-lg text-foreground">
            <Wallet className="h-6 w-6 text-signal" />
            <span>FINANCE TRACKER</span>
          </div>

          <nav className="hidden lg:flex items-center gap-1 ml-8">
            <NavLinks />
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-muted-foreground hover:text-foreground"
            asChild
          >
            <Link to="/settings">
              <Settings className="h-5 w-5" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" onClick={toggleTheme}>
            {theme === "light" ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-moon"
              >
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-sun"
              >
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2" />
                <path d="M12 20v2" />
                <path d="m4.93 4.93 1.41 1.41" />
                <path d="m17.66 17.66 1.41 1.41" />
                <path d="M2 12h2" />
                <path d="M20 12h2" />
                <path d="m6.34 17.66-1.41 1.41" />
                <path d="m19.07 4.93-1.41 1.41" />
              </svg>
            )}
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <nav className="lg:hidden shrink-0 flex items-center justify-between border-b bg-card px-4 py-2 gap-1 overflow-x-auto no-scrollbar">
        <MobileNavLinks />
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 lg:gap-6 lg:p-8 pb-[calc(1rem+env(safe-area-inset-bottom))] bg-background/50">
        <div className="max-w-7xl mx-auto w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function NavLinks() {
  return (
    <>
      <Link
        to="/finance-voucher"
        className="flex items-center gap-3 rounded-md px-4 py-2 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground transition-all hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&.active]:text-signal [&.active]:bg-accent lg:[&.active]:bg-accent lg:[&.active]:rounded-none lg:h-16 lg:px-8 lg:py-0"
      >
        TRANSACTION

      </Link>
      <Link
        to="/dashboard"
        className="flex items-center gap-3 rounded-md px-4 py-2 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground transition-all hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&.active]:text-signal [&.active]:bg-accent lg:[&.active]:bg-accent lg:[&.active]:rounded-none lg:h-16 lg:px-8 lg:py-0"
      >
        DASHBOARD
      </Link>
      <Link
        to="/income"
        className="flex items-center gap-3 rounded-md px-4 py-2 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground transition-all hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&.active]:text-signal [&.active]:bg-accent lg:[&.active]:bg-accent lg:[&.active]:rounded-none lg:h-16 lg:px-8 lg:py-0"
      >
        INCOME
      </Link>
      <Link
        to="/expense"
        className="flex items-center gap-3 rounded-md px-4 py-2 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground transition-all hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&.active]:text-signal [&.active]:bg-accent lg:[&.active]:bg-accent lg:[&.active]:rounded-none lg:h-16 lg:px-8 lg:py-0"
      >
        EXPENSE
      </Link>
      <Link
        to="/assets"
        className="flex items-center gap-3 rounded-md px-4 py-2 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground transition-all hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&.active]:text-signal [&.active]:bg-accent lg:[&.active]:bg-accent lg:[&.active]:rounded-none lg:h-16 lg:px-8 lg:py-0"
      >
        ASSETS
      </Link>
    </>
  );
}

function MobileNavLinks() {
  return (
    <>
      <Link
        to="/finance-voucher"
        className="flex flex-col items-center justify-center gap-1 text-[8px] font-black uppercase tracking-widest rounded-md px-2 py-1 text-muted-foreground transition-all hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&.active]:text-signal [&.active]:bg-accent"
      >
        <ReceiptText className="h-5 w-5" />
        TRANSACTION
      </Link>
      <Link
        to="/dashboard"
        className="flex flex-col items-center justify-center gap-1 text-[8px] font-black uppercase tracking-widest rounded-md px-2 py-1 text-muted-foreground transition-all hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&.active]:text-signal [&.active]:bg-accent"
      >
        <LayoutDashboard className="h-5 w-5" />
        DASHBOARD
      </Link>
      <Link
        to="/income"
        className="flex flex-col items-center justify-center gap-1 text-[8px] font-black uppercase tracking-widest rounded-md px-2 py-1 text-muted-foreground transition-all hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&.active]:text-signal [&.active]:bg-accent"
      >
        <Wallet className="h-5 w-5" />
        INCOME
      </Link>
      <Link
        to="/expense"
        className="flex flex-col items-center justify-center gap-1 text-[8px] font-black uppercase tracking-widest rounded-md px-2 py-1 text-muted-foreground transition-all hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&.active]:text-signal [&.active]:bg-accent"
      >
        <TrendingDown className="h-5 w-5" />
        EXPENSE
      </Link>
      <Link
        to="/assets"
        className="flex flex-col items-center justify-center gap-1 text-[8px] font-black uppercase tracking-widest rounded-md px-2 py-1 text-muted-foreground transition-all hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&.active]:text-signal [&.active]:bg-accent"
      >
        <Landmark className="h-5 w-5" />
        ASSETS
      </Link>
    </>
  );
}
