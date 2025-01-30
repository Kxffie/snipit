import "./App.css";

import { ThemeProvider } from "@/components/theme-provider";

export const NewSnippet = () => {
  return (
    <ThemeProvider>
      <div className="h-full flex flex-col justify-center items-center">
        <h1 className="text-2xl font-bold">EdiNewt Snippet</h1>
        <p>New Snippet</p>
      </div>
    </ThemeProvider>
  );
};
