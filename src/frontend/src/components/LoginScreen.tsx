import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck, Wallet } from "lucide-react";
import { motion } from "motion/react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export function LoginScreen() {
  const { login, isLoggingIn, isInitializing } = useInternetIdentity();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background grid */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(oklch(0.17 0.018 255) 1px, transparent 1px), linear-gradient(90deg, oklch(0.17 0.018 255) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative w-full max-w-sm"
      >
        {/* Card */}
        <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
          {/* Header accent */}
          <div className="h-1 w-full bg-primary" />

          <div className="p-8">
            {/* Logo area */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center">
                <Wallet className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-base font-semibold text-foreground leading-tight">
                  Payment Accounts
                </h1>
                <p className="text-xs text-muted-foreground">Manager</p>
              </div>
            </div>

            {/* Tagline */}
            <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
              Track payments, commissions, and send WhatsApp reminders — all
              from one compact dashboard.
            </p>

            {/* Features */}
            <div className="space-y-2 mb-8">
              {[
                "Excel-style compact table view",
                "WhatsApp payment reminders",
                "Overdue payment alerts",
              ].map((feat) => (
                <div key={feat} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary opacity-70" />
                  <span className="text-xs text-muted-foreground">{feat}</span>
                </div>
              ))}
            </div>

            {/* Sign in button */}
            <Button
              onClick={login}
              disabled={isLoggingIn || isInitializing}
              className="w-full"
              data-ocid="auth.login_button"
            >
              {isLoggingIn || isInitializing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Sign In with Internet Identity
                </>
              )}
            </Button>

            <p className="text-[10px] text-muted-foreground text-center mt-4 opacity-70">
              Secured by Internet Computer
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-muted-foreground mt-4 opacity-50">
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
              typeof window !== "undefined" ? window.location.hostname : "",
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:opacity-100 transition-opacity"
          >
            caffeine.ai
          </a>
        </p>
      </motion.div>
    </div>
  );
}
