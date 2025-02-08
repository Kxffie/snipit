import "./App.css";

import { useState } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import Navbar from "./components/ui/navbar";
import Sidebar from "./components/ui/sidebar";
import Settings from "./Settings";
import { Home } from "./Home";
import { SnipItsView } from "./SnipItsView";
import { NewSnippet } from "./NewSnippet";


export const App = () => {
  const [activePage, setActivePage] = useState<"home" | "snipits" | "settings" | "newsnippet">("home");

  return (
    <ThemeProvider>
      <div className="flex flex-col h-screen overflow-hidden ">
        <Navbar />

        <div className="flex h-screen overflow-hidden">
          <Sidebar setActivePage={setActivePage} />

          <div className="flex-1 p-4 overflow-hidden rounded-tl-lg">
            {activePage === "home" && <Home />}
            {activePage === "snipits" && <SnipItsView setActivePage={setActivePage} />}
            {activePage === "settings" && <Settings />}
            {activePage === "newsnippet" && <NewSnippet />}
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
};