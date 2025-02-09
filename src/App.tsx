import "./App.css";

import { useState } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import Navbar from "./components/ui/navbar";
import Sidebar from "./components/ui/sidebar";
import Settings from "./Settings";
import { Home } from "./Home";
import { SnipItsView } from "./SnipItsView";
import { NewSnippet } from "./NewSnippet";
import { Toaster } from "./components/ui/toaster";

type Page = "home" | "snipits" | "settings" | "newsnippet" | "view";

export const App = () => {
  const [activePage, setActivePage] = useState<Page>("home");

  return (
    <ThemeProvider>
      <div className="flex flex-col h-screen overflow-hidden ">
        <Navbar />
        <Toaster />

        <div className="flex h-screen overflow-hidden">
          <Sidebar setActivePage={setActivePage} />

          <div className="flex-1 overflow-hidden rounded-tl-lg">
            {activePage === "home" && <Home />}
            {activePage === "snipits" && <SnipItsView setActivePage={setActivePage} />}
            {activePage === "settings" && <Settings />}
            {activePage === "newsnippet" && <NewSnippet onClose={() => setActivePage("snipits")} setActivePage={setActivePage} />}

          </div>
        </div>
      </div>
    </ThemeProvider>
  );
};