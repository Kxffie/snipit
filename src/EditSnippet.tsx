import "./App.css";

import { ThemeProvider } from "@/components/theme-provider";

export const EditSnippet = () => {
  return (
    <ThemeProvider>
      <div className="h-full flex flex-col justify-center items-center">
        <h1 className="text-2xl font-bold">Edit Snippet</h1>
        <p>Edit Snippet</p>
      </div>
    </ThemeProvider>
  );
};
