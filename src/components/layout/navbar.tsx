import { appWindow } from "@tauri-apps/api/window";
import { Minus, Square, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

export default function Navbar() {
  const [isWindowFocused, setIsWindowFocused] = useState(true);

  useEffect(() => {
    const handleFocus = () => setIsWindowFocused(true);
    const handleBlur = () => setIsWindowFocused(false);

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);


  return (
    <div data-tauri-drag-region className="relative w-full h-10 bg-secondary flex justify-between items-center border-b border-border shadow-md">
      
      {/* Window Accent Border */}
      <div className={`absolute top-0 left-0 w-full h-[2px] ${isWindowFocused ? 'bg-accent' : 'bg-accent/40'} rounded-t-lg`} />

      {/* App Name */}
      <h1 className="text-md pl-3 font-semibold tracking-wide text-muted-foreground">SNIPIT</h1>

      {/* Window Buttons */}
      <div className="flex space-x-1">
        <Button variant="ghost" size="icon" className="hover:bg-gray-600/20" onClick={() => appWindow.minimize()}>
          <Minus className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="hover:bg-gray-600/20" onClick={() => appWindow.toggleMaximize()}>
          <Square className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="hover:bg-red-600/20" onClick={() => appWindow.close()}>
          <X className="w-4 h-4 text-red-500" />
        </Button>
      </div>

    </div>
  );
}