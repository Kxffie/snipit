import "./App.css";

import { DiJavascript, DiHtml5, DiCss3 } from "react-icons/di";
import { ThemeProvider } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";

export const SnipItsView = () => {
  return (
    <ThemeProvider>

      <div className="h-full flex">

        <aside className="w-64 p-4 border-r">
          <h2 className="text-lg font-bold mb-4">Search</h2>
          <div className="space-y-2">
              <Button variant="ghost" className="w-full justify-start">
                <DiJavascript className="w-4 h-4" />
                <span className="ml-2">Connections</span>
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <DiHtml5 className="w-4 h-4" />
                <span className="ml-2">HTML</span>
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <DiCss3 className="w-4 h-4" />
                <span className="ml-2">CSS</span>
              </Button>
          </div>
        </aside>

        <main className="flex-1 p-6">
          <h1 className="text-2xl font-bold">SnipIts View</h1>
          <p>View SnipIts Here</p>
        </main>

      </div>
    </ThemeProvider>
  );
};
