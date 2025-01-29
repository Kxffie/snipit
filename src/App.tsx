import "./App.css";

import { ThemeProvider } from "@/components/theme-provider";
import Navbar from "./components/ui/navbar";

export const App = () => {
  return (
    <ThemeProvider>
      <div className="flex">
        <Navbar />
      </div>
    </ThemeProvider>
  );
};
