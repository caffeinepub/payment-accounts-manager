import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { LogOut, Plus, RefreshCw, Search, Share2, Wallet } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { EntryFormDialog } from "./components/EntryFormDialog";
import { EntryTable } from "./components/EntryTable";
import { LoginScreen } from "./components/LoginScreen";
import { SummaryBar } from "./components/SummaryBar";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useGetEntries } from "./hooks/useQueries";
import { formatCurrency } from "./utils/currency";

function MainApp() {
  const { clear, identity } = useInternetIdentity();
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const {
    data: entries = [],
    isLoading,
    refetch,
    isFetching,
  } = useGetEntries();

  const principalShort = identity
    ? `${identity.getPrincipal().toString().slice(0, 8)}...`
    : "";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Sticky top bar */}
      <header className="sticky top-0 z-20 bg-card border-b border-border sticky-shadow">
        <div className="flex items-center justify-between px-3 py-2 max-w-[1400px] mx-auto w-full">
          {/* Left: brand */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center flex-shrink-0">
              <Wallet className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <h1 className="text-sm font-semibold text-foreground tracking-tight">
              Payment Accounts
            </h1>
            <span className="hidden sm:inline text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono">
              {principalShort}
            </span>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() => refetch()}
              disabled={isFetching}
              title="Refresh"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`}
              />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              title="Share"
              data-ocid="share.button"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href).then(() => {
                  toast.success("Link copied to clipboard");
                });
              }}
            >
              <Share2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1.5"
              onClick={clear}
              data-ocid="auth.logout_button"
            >
              <LogOut className="h-3 w-3" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 px-3 py-3 max-w-[1400px] mx-auto w-full">
        {/* Summary bar */}
        {isLoading ? (
          <div className="flex gap-2 py-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-8 w-36 rounded" />
            ))}
          </div>
        ) : (
          <SummaryBar entries={entries} />
        )}

        {/* Toolbar: search + add entry */}
        <div className="flex items-center gap-2 mt-3 mb-2">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, mobile, amount..."
              className="h-8 pl-8 text-xs"
              data-ocid="search.input"
            />
          </div>

          <div className="flex-1" />

          <Button
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={() => setAddOpen(true)}
            data-ocid="add_entry.open_modal_button"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Entry
          </Button>
        </div>

        {/* Table */}
        <EntryTable entries={entries} isLoading={isLoading} search={search} />

        {/* Row count footer */}
        {!isLoading && entries.length > 0 && (
          <div className="mt-2 text-[10px] text-muted-foreground text-right">
            {search
              ? `Showing ${
                  entries.filter((e) => {
                    const q = search.toLowerCase();
                    return (
                      e.name.toLowerCase().includes(q) ||
                      e.mobileNumber.toLowerCase().includes(q) ||
                      formatCurrency(e.amount).includes(q) ||
                      formatCurrency(e.totalAmount).includes(q)
                    );
                  }).length
                } of ${entries.length} entries`
              : `${entries.length} total entries`}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto py-3 px-3 border-t border-border">
        <p className="text-[10px] text-muted-foreground text-center opacity-50">
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
              window.location.hostname,
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:opacity-100 transition-opacity"
          >
            caffeine.ai
          </a>
        </p>
      </footer>

      {/* Add Entry Modal */}
      <EntryFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        editEntry={null}
      />

      <Toaster richColors position="top-right" />
    </div>
  );
}

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center animate-pulse">
            <Wallet className="w-4 h-4 text-primary-foreground" />
          </div>
          <p className="text-xs text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!identity) {
    return <LoginScreen />;
  }

  return <MainApp />;
}
