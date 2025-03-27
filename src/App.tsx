import "./App.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/theme-provider";
import Navbar from "./components/layout/navbar";
import Sidebar from "./components/layout/sidebar";
import Settings from "./Settings";
import { Home } from "./Home";
// import { SnipItsList } from "./components/snippets/SnipItsList";
// import { SnipItForm } from "./components/snippets/SnipItForm";

import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SnipIts } from "./SnipIts";

const queryClient = new QueryClient();

export const App = () => {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <TooltipProvider>
            <div className="flex flex-col h-screen overflow-hidden">
              <Navbar />
              <Toaster />
              <div className="flex h-screen overflow-hidden">
                <Sidebar />
                <div className="flex-1 overflow-hidden rounded-tl-lg">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    {/* <Route path="/snipits" element={<SnipItsList />} /> */}
                    <Route path="/snipits" element={<SnipIts />} />
                    <Route path="/settings" element={<Settings />} />
                    {/* <Route path="/newsnippet" element={<SnipItForm />} /> */}
                    {/* Add additional routes as needed */}
                  </Routes>
                </div>
              </div>
            </div>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};
