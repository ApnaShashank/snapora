"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("fpp_theme") as "light" | "dark" | null;
    const resolved = saved ?? "light";
    setTheme(resolved);
    document.documentElement.setAttribute("data-theme", resolved);
    document.documentElement.classList.toggle("dark", resolved === "dark");
    document.documentElement.classList.toggle("light", resolved === "light");
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("fpp_theme", next);
    document.documentElement.setAttribute("data-theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
    document.documentElement.classList.toggle("light", next === "light");
  };

  // Avoid flash while hydrating
  if (!mounted) {
    return <div className={`w-9 h-9 rounded-xl border border-(--border) bg-(--surface) ${className}`} />;
  }

  return (
    <button
      onClick={toggleTheme}
      className={`relative flex items-center justify-center w-9 h-9 rounded-xl border border-(--border) bg-(--surface) hover:bg-(--surface-hover) hover:border-(--border-strong) text-(--text-muted) hover:text-(--text) transition-all duration-150 active:scale-95 ${className}`}
      title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
      aria-label="Toggle theme"
    >
      {theme === "light" ? (
        <Moon className="w-4 h-4" />
      ) : (
        <Sun className="w-4 h-4" />
      )}
    </button>
  );
}
