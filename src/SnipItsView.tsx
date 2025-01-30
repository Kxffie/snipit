import "./App.css";

import { ThemeProvider } from "@/components/theme-provider";

export const SnipItsView = () => {
  return (
    <ThemeProvider>
      <div className="h-full flex flex-col justify-center items-center">
        <h1 className="text-2xl font-bold">SnipIts View</h1>
        <p>View SnipIts Here</p>
      </div>
    </ThemeProvider>
  );
};
