"use client";

import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { LogOut, Terminal, User } from "lucide-react";
import { motion } from "framer-motion";

export function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 24 }}
      className="border-b-2 border-primary bg-black/80 sticky top-0 z-50 backdrop-blur-md"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8">
        <div className="flex items-center gap-4 group cursor-pointer">
          <motion.div
            className="flex h-10 w-10 items-center justify-center bg-primary text-black font-black uppercase transition-transform group-hover:scale-110"
          >
            <Terminal className="h-6 w-6" />
          </motion.div>
          <div className="flex flex-col justify-center">
            <h1 className="text-xl font-black leading-none tracking-tighter uppercase font-sans">
              GOOD<span className="text-primary">BAI</span><span className="animate-pulse">_</span>
            </h1>
            <p className="text-[10px] text-primary uppercase font-mono tracking-widest mt-1 opacity-80">
              Structural Analysis
            </p>
          </div>
        </div>

        {isAuthenticated && user && (
          <motion.nav
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-4"
          >
            <motion.div className="flex items-center gap-2 text-sm bg-card border border-border px-3 py-1 font-mono uppercase tracking-wider">
              {user.images?.[0] ? (
                <img
                  src={user.images[0].url}
                  alt={user.display_name || "User"}
                  className="h-6 w-6 border-b-2 border-r-2 border-primary object-cover"
                />
              ) : (
                <div className="flex h-6 w-6 items-center justify-center bg-muted border border-border">
                  <User className="h-4 w-4" />
                </div>
              )}
              <span className="hidden sm:inline">
                {user.display_name}
              </span>
            </motion.div>
            <Button variant="ghost" size="sm" onClick={logout} className="hover:bg-destructive hover:text-black rounded-none px-4 transition-colors font-mono font-bold border border-transparent hover:border-destructive uppercase text-xs">
              <LogOut className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Terminate</span>
            </Button>
          </motion.nav>
        )}
      </div>
    </motion.header>
  );
}
