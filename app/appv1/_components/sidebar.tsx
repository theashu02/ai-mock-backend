"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, ChevronLeft, LayoutDashboard, Zap, ArrowLeftRight, ScanSearch, BookMarked, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";

export const NAV_ITEMS = [
  { href: "/appv1/simulate-apis", label: "Simulate APIs", icon: Zap },
  { href: "/appv1/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/appv1/schema-convertor", label: "Schema Converter", icon: ArrowLeftRight },
  { href: "/appv1/schema-analyser", label: "Schema Analyzer", icon: ScanSearch },
  { href: "/appv1/my-apis", label: "My APIs", icon: BookMarked },
];

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const pathname = usePathname();

  const UserData = {
    name: "Alex Mercer",
    email: "alex@obsidian.io",
    initial: "AM",
  };

  const [isPending, startTransition] = useTransition();

  const handleSignOut = () => {
    startTransition(() => {
      console.log("Signing out...");
    });
  };

  return (
    <aside className={`flex h-screen flex-col border-r border-border bg-sidebar p-2 transition-[width] duration-500 ${isOpen ? "w-64" : "w-24"}`}>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden border border-border bg-surface-container">
        <div className={`${isOpen ? "px-5 pt-5" : "flex flex-col items-center pt-5"} pb-2`}>
          <div className={`flex items-center gap-3 transition-all ${isOpen ? "justify-center" : "justify-center"}`}>
            {isOpen ? (
              <span className="text-lg font-semibold tracking-[0.2em] text-foreground">Obsidian</span>
            ) : (
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                <Cpu className="h-4 w-4 text-primary" />
              </div>
            )}
          </div>
          <button onClick={() => setIsOpen((prev) => !prev)} className={`mt-4 flex items-center text-sm text-muted-foreground transition hover:text-foreground ${isOpen ? "gap-2" : "w-full justify-center"}`}>
            <ChevronLeft className={`size-4 transition ${isOpen ? "" : "rotate-180"}`} />
            {isOpen && <span className="tracking-wider">Collapse</span>}
          </button>
        </div>

        <div className="h-px w-full bg-border/50" />

        <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-6">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
            const content = (
              <div className="flex gap-2">
                <item.icon className="size-5" strokeWidth={1.5} />
                {isOpen && <span className="text-sm tracking-widest font-normal">{item.label}</span>}
              </div>
            );

            return (
              <Button
                key={item.href}
                variant="ghost"
                title={!isOpen ? item.label : undefined}
                className={`h-12 w-full hover:bg-primary/20 ${isOpen ? "justify-start gap-3 px-4 py-3" : "justify-center gap-0 px-0 py-3"} ${isActive ? "bg-primary/10 text-primary font-bold" : "text-muted-foreground"}`}
              >
                <Link href={item.href}>{content}</Link>
              </Button>
            );
          })}
        </nav>

        {/* <div className="h-px w-full bg-border/50" /> */}

        <div className="px-4 py-4 text-sm text-muted-foreground">
          <div className={`flex ${isOpen ? "items-center gap-3" : "flex-col items-center gap-2"} text-foreground`}>
            <div className="grid p-3 place-items-center rounded-full bg-primary/15 text-xs font-semibold text-primary border border-primary/20">{UserData.initial}</div>
            {isOpen && (
              <div className="min-w-0">
                <p className="truncate font-medium">{UserData.name}</p>
                <p className="truncate text-xs text-muted-foreground">{UserData.email}</p>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-border/50 px-4 py-3 space-y-2 flex flex-col items-center">
          <ModeToggle isOpen={isOpen} />
          <Button 
            onClick={handleSignOut} 
            variant="ghost"
            className={`h-10 w-full hover:bg-destructive/10 hover:text-destructive group ${isOpen ? "justify-between px-4" : "justify-center px-0"}`}
          >
            {isOpen && (
              <span className="text-sm tracking-widest font-normal">{isPending ? "Signing out..." : "Logout"}</span>
            )}
            <ArrowUpRight className={`h-4 w-4 transition-transform duration-300 ${isOpen ? "group-hover:-translate-y-0.5 group-hover:translate-x-0.5" : ""}`} />
          </Button>
        </div>
      </div>
    </aside>
  );
}
