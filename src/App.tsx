import "./App.css";
import { useState } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import Navbar from "./components/layout/navbar";
import Sidebar from "./components/layout/sidebar";
import Settings from "./Settings";
import { Home } from "./Home";
import { SnipItsList } from "./components/snippets/SnipItsList";
import { SnipItForm } from "./components/snippets/SnipItForm";
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

type Page = "home" | "snipits" | "settings" | "newsnippet" | "view";

export const App = () => {
  const [activePage, setActivePage] = useState<Page>("home");

  return (
    <ThemeProvider>
      <TooltipProvider>
        <div className="flex flex-col h-screen overflow-hidden">
          <Navbar />
          <Toaster />

          <div className="flex h-screen overflow-hidden">
            <Sidebar setActivePage={setActivePage} />

            <div className="flex-1 overflow-hidden rounded-tl-lg">
              {activePage === "home" && <Home />}
              {activePage === "snipits" && <SnipItsList setActivePage={setActivePage} />}
              {activePage === "settings" && <Settings />}
              {activePage === "newsnippet" && (
                <SnipItForm onClose={() => setActivePage("snipits")} onSave={() => setActivePage("snipits")} />
              )}
            </div>
          </div>
        </div>
      </TooltipProvider>
    </ThemeProvider>
  );
};
