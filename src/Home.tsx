import "./App.css";

import { ThemeProvider } from "@/components/theme-provider";

export const Home = () => {
  return (
    <ThemeProvider>
      <div className="h-full flex flex-col justify-center items-center">
        <h1 className="text-2xl font-bold">Home</h1>
        <p>Home Page</p>
      </div>
    </ThemeProvider>
  );
};
