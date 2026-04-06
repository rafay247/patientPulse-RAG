"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
    const [isDark, setIsDark] = useState(true);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const stored = localStorage.getItem("theme");
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        const shouldBeDark = stored ? stored === "dark" : prefersDark;
        setIsDark(shouldBeDark);
        document.documentElement.classList.toggle("dark", shouldBeDark);
        document.documentElement.classList.toggle("light", !shouldBeDark);
    }, []);

    const toggleTheme = () => {
        const newIsDark = !isDark;
        setIsDark(newIsDark);
        localStorage.setItem("theme", newIsDark ? "dark" : "light");
        document.documentElement.classList.toggle("dark", newIsDark);
        document.documentElement.classList.toggle("light", !newIsDark);
    };

    if (!mounted) return null;

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-full border border-border/70 bg-card/30 hover:bg-card/60 backdrop-blur-sm transition-all"
            aria-label="Toggle theme"
        >
            {isDark ? (
                <Sun className="h-5 w-5 text-foreground/80 hover:text-foreground transition-colors" />
            ) : (
                <Moon className="h-5 w-5 text-foreground/70 hover:text-foreground transition-colors" />
            )}
        </Button>
    );
}
