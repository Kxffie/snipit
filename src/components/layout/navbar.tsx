import { appWindow } from "@tauri-apps/api/window";
import { Minus, Square, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

export default function Navbar() {
  const [isWindowFocused, setIsWindowFocused] = useState(true);

  useEffect(() => {
    const handleFocus = () => setIsWindowFocused(true);
    const handleBlur = () => setIsWindowFocused(false);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
    };
  }, []);

  return (
    <div
      data-tauri-drag-region
      className="relative z-50 w-full h-10 flex justify-between items-center px-3 bg-white/5 backdrop-blur border-b border-white/10 shadow-sm"
    >
      {/* Top glow indicator */}
      <div
        className={`absolute top-0 left-0 w-full h-[2px] transition-all duration-300 ${
          isWindowFocused ? "bg-accent" : "bg-accent/30"
        } rounded-t`}
      />

      {/* App title */}
      <div className="flex items-center gap-2 text-sm font-medium text-white/70">
        <span>SnipIt</span>
      </div>

      {/* Window controls */}
      <div className="flex space-x-1">
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-white/10 transition"
          onClick={() => appWindow.minimize()}
        >
          <Minus className="w-4 h-4 text-white/70" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-white/10 transition"
          onClick={() => appWindow.toggleMaximize()}
        >
          <Square className="w-4 h-4 text-white/70" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-red-500/10 transition"
          onClick={() => appWindow.close()}
        >
          <X className="w-4 h-4 text-red-500" />
        </Button>
      </div>
    </div>
  );
}
