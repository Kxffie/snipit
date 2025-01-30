import { appWindow } from "@tauri-apps/api/window";
import { Minus, Square, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  return (
    <div data-tauri-drag-region className="w-full p-2 bg-secondary flex justify-between items-center">

      <h1 className="text-xl font-bold">SnipIt</h1>

      <div className="flex gap-2">
        <Button variant="ghost" size="icon" onClick={() => appWindow.minimize()}>
          <Minus className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => appWindow.toggleMaximize()}>
          <Square className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => appWindow.close()}>
          <X className="w-4 h-4 text-red-500" />
        </Button>
      </div>
    </div>
  );
}
