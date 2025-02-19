import "./App.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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
import { Collection } from "@/lib/CollectionsService";

type Page = "home" | "snipits" | "settings" | "newsnippet" | "view";

const queryClient = new QueryClient();

export const App = () => {
  const [activePage, setActivePage] = useState<Page>("home");

  // Store the currently selected collection here in the App,
  // so we can pass it to both SnipItsList and SnipItForm.
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <div className="flex flex-col h-screen overflow-hidden">
            <Navbar />
            <Toaster />

            <div className="flex h-screen overflow-hidden">
              <Sidebar setActivePage={setActivePage} />

              <div className="flex-1 overflow-hidden rounded-tl-lg">
                {activePage === "home" && <Home />}
                
                {activePage === "snipits" && (
                  <SnipItsList
                    setActivePage={setActivePage}
                    selectedCollection={selectedCollection}
                    setSelectedCollection={setSelectedCollection}
                  />
                )}

                {activePage === "settings" && <Settings />}

                {activePage === "newsnippet" && (
                  <SnipItForm
                    onClose={() => setActivePage("snipits")}
                    onSave={() => setActivePage("snipits")}
                    selectedCollection={selectedCollection}
                  />
                )}
              </div>
            </div>
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};
