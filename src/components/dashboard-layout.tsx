"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trophy, Calendar, Medal, Settings, Menu, X, Activity } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const navigation = [
  { name: "Dashboard", href: "/", icon: Trophy },
  { name: "Brackets", href: "/brackets", icon: Medal },
  { name: "Schedule", href: "/schedule", icon: Calendar },
  { name: "Umpire Board", href: "/badminton-score", icon: Activity },
  { name: "Admin", href: "/admin", icon: Settings },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex bg-neutral-950 text-white min-h-screen">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-white/10 p-4 bg-black/20 backdrop-blur-lg">
        <div className="flex items-center gap-2 mb-8 px-2">
          <Trophy className="h-8 w-8 text-cyan-500" />
          <span className="font-bold text-xl tracking-wider">UNION GAMES</span>
        </div>
        <nav className="flex-1 space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"
                    : "text-neutral-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-black/40 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-2">
          <Trophy className="h-6 w-6 text-cyan-500" />
          <span className="font-bold">UNION GAMES</span>
        </div>
        <button onClick={() => setSidebarOpen(true)}>
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Sidebar - Mobile drawer */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-50 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 20 }}
              className="fixed top-0 left-0 bottom-0 w-3/4 max-w-sm bg-neutral-900 border-r border-white/10 p-4 z-50 flex flex-col md:hidden"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <Trophy className="h-6 w-6 text-cyan-500" />
                  <span className="font-bold">UNION</span>
                </div>
                <button onClick={() => setSidebarOpen(false)}>
                  <X className="h-6 w-6" />
                </button>
              </div>
              <nav className="space-y-2">
                {navigation.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                        isActive
                          ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"
                          : "text-neutral-400 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 pt-20 md:pt-8 bg-[radial-gradient(ellipse_at_top,_var(--tw-colors-neutral-900),_var(--tw-colors-black))]">
        {children}
      </main>
    </div>
  );
}
