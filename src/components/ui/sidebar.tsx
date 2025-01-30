import { Home, FileText, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

type SidebarProps = {
    setActivePage: (page: "home" | "snipits" | "settings") => void;
  };
  
  export default function Sidebar({ setActivePage }: SidebarProps) {
    return (
      <nav className="h-full w-16 flex flex-col items-center bg-secondary shadow-md p-2">
        {/* Navigation Buttons */}
        <div className="flex flex-col items-center gap-4 mt-4">
          <Button variant="ghost" size="icon" onClick={() => setActivePage("home")}>
            <Home className="w-6 h-6" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setActivePage("snipits")}>
            <FileText className="w-6 h-6" />
          </Button>
        </div>
  
        {/* Spacer */}
        <div className="flex-grow" />
  
        {/* Settings Button */}
        <Button variant="ghost" size="icon" className="mt-4" onClick={() => setActivePage("settings")}>
          <Settings className="w-6 h-6" />
        </Button>
      </nav>
    );
  }