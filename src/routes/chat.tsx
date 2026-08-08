import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Sparkles, Clock, Home, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "Copo AI Assistant — Available Soon | St. Francis Notes" },
      {
        name: "description",
        content:
          "Copo AI Assistant for St. Francis College BCA students is undergoing scheduled upgrades and will be available soon.",
      },
      { property: "og:title", content: "Copo AI Assistant — Available Soon" },
      { property: "og:description", content: "Copo AI study companion will be available soon." },
    ],
  }),
  component: CopoComingSoonPage,
});

function CopoComingSoonPage() {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-100 flex-col overflow-hidden">
      {/* Top Header */}
      <header className="px-4 md:px-6 py-4 border-b border-white/10 bg-slate-900/60 backdrop-blur shrink-0">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-300 hover:text-white hover:bg-white/5"
              onClick={() => navigate({ to: "/" })}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-900 border border-white/10 p-1 shadow-md overflow-hidden">
                <img
                  src="/college-logo.png"
                  alt="St. Francis College Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-base md:text-lg font-semibold tracking-tight flex items-center gap-2">
                  Copo Assistant
                  <Badge className="bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[10px] uppercase tracking-wider">
                    Available Soon
                  </Badge>
                </h1>
                <p className="text-xs text-slate-400">
                  St. Francis College · Bengaluru City University BCA
                </p>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate({ to: "/" })}
            className="text-xs border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 gap-1.5"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto flex items-center justify-center p-4 md:p-8 relative">
        {/* Background Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="max-w-md w-full text-center space-y-6 relative z-10 my-auto">
          {/* Titles */}
          <div className="space-y-3">
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-white">
              Copo is Available Soon!
            </h2>
            <p className="neon-lightning-text text-base md:text-xl font-bold tracking-wide uppercase pt-1">
              Your AI Study Companion
            </p>
          </div>

          {/* Actions */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              onClick={() => navigate({ to: "/" })}
              className="w-full sm:w-auto px-6 py-2.5 h-11 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-xl shadow-lg shadow-indigo-600/25 transition-all"
            >
              <Home className="w-4 h-4 mr-2" />
              Return to Notes Dashboard
            </Button>
          </div>
        </div>
      </div>

      {/* Fixed Status Bar */}
      <div className="border-t border-white/10 bg-slate-900/80 backdrop-blur py-3 px-4 shrink-0">
        <div className="max-w-2xl mx-auto flex items-center justify-center gap-2 text-xs text-slate-400 bg-slate-800/80 border border-white/10 rounded-xl py-2 px-4 text-center shadow-inner">
          <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>Copo Assistant is temporarily offline — Available Soon!</span>
        </div>
      </div>
    </div>
  );
}
