import "./App.css";

import { useState } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import Navbar from "./components/ui/navbar";
import Sidebar from "./components/ui/sidebar";
import Settings from "./Settings";
import { Home } from "./Home";
import { SnipItsView } from "./SnipItsView";


export const App = () => {
  const [activePage, setActivePage] = useState<"home" | "snipits" | "settings">("home");

  return (
    <ThemeProvider>
      <div className="flex flex-col h-screen overflow-hidden">
        {/* Navbar at the top */}
        <Navbar />

        {/* Sidebar + Main Content */}
        <div className="flex flex-1 h-full">
          {/* Sidebar - Pass state updater */}
          <Sidebar setActivePage={setActivePage} />

          {/* Main Content - Render Active Page */}
          <div className="flex-1 p-4 overflow-hidden">
            {activePage === "home" && <Home />}
            {activePage === "snipits" && <SnipItsView />}
            {activePage === "settings" && <Settings />}
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
};