"use client";

import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { LogOut, Music, User } from "lucide-react";
import { motion } from "framer-motion";

export function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 24 }}
      className="border-b border-border/50 bg-card/90 sticky top-0 z-50 backdrop-blur-xl"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8">
        <div className="flex items-center gap-4">
          <motion.div
            whileHover={{ scale: 1.05, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20"
          >
            <Music className="h-6 w-6 text-primary-foreground" />
          </motion.div>
          <div className="flex flex-col justify-center">
            <h1 className="text-xl font-bold leading-none tracking-tight">good<span className="text-primary">bAI</span></h1>
            <p className="text-xs text-muted-foreground font-medium mt-1">
              AI Music Detector for Spotify
            </p>
          </div>
        </div>

        {isAuthenticated && user && (
          <motion.nav
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-4"
          >
            <motion.div whileHover={{ scale: 1.02 }} className="flex items-center gap-2 text-sm bg-secondary/50 rounded-full pr-4 pl-2 py-1.5 border border-border/50">
              {user.images?.[0] ? (
                <img
                  src={user.images[0].url}
                  alt={user.display_name || "User"}
                  className="h-8 w-8 rounded-full border border-primary/20 object-cover"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted border border-border">
                  <User className="h-4 w-4" />
                </div>
              )}
              <span className="hidden font-medium sm:inline">
                {user.display_name}
              </span>
            </motion.div>
            <Button variant="ghost" size="sm" onClick={logout} className="hover:bg-destructive/10 hover:text-destructive rounded-full px-4 transition-colors">
              <LogOut className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </motion.nav>
        )}
      </div>
    </motion.header>
  );
}
