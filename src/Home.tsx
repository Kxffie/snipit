"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { useSnippetsQuery } from "@/lib/SnipItService";

const rotatingLines = [
  "Your offline code snippet manager",
  "Your unstoppable code library",
  "Your dev cheat sheet",
  "Your personal code vault",
  "Your creative code companion",
  "Your snippet aggregator",
  "Your rapid debugging ally",
  "Your daily dev reference",
  "Your evolving knowledge bank",
  "Your snippet synergy toolkit",
  "Your code collaboration spark",
  "Your coding productivity booster",
  "Your developer survival kit",
  "Your snippet treasure trove",
  "Your code intelligence hub",
  "Your quick syntax refresher",
  "Your coding buddy on demand",
  "Your always-ready snippet stash",
  "Your minimalist code library",
  "Your hidden dev advantage",
  "Your daily coding sidekick",
  "Your star snippet collection",
  "Your unstoppable learning engine",
  "Your frictionless coding mentor",
  "Your boundless code archive",
  "Your swift snippet solution",
];


function RotatingText() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setIndex((prev) => (prev + 1) % rotatingLines.length);
    }, 3000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="relative h-6 overflow-hidden">
      <AnimatePresence mode="popLayout">
        <motion.span
          key={index}
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          exit={{ y: "-100%", opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="absolute w-full text-muted-foreground"
          style={{ whiteSpace: "nowrap" }}
        >
          {rotatingLines[index]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

export const Home = () => {
  const { data: snippets = [] } = useSnippetsQuery();

  const totalSnippets = snippets.length;
  const starredSnippets = snippets.filter((s) => s.starred).length;

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center px-6 py-8">
      <div className="w-full max-w-3xl bg-background rounded-lg p-8 shadow text-center sm:text-left">

        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">

          <div className="sm:flex-1">
            <p className="text-sm text-muted-foreground">Welcome</p>
            <h1 className="mt-1 text-4xl sm:text-5xl font-bold inline-block py-1 text-accent mb-2">
              SnipIt
            </h1>

            <RotatingText />
          </div>

          <div className="flex-shrink-0">
            <img
              src=""
              alt="Placeholder"
              className="w-64 h-64 object-cover rounded-md shadow"
            />
          </div>
        </div>

        <div className="flex flex-wrap justify-center sm:justify-start gap-4 mt-8">
          <Card className="p-4 w-40 text-center bg-muted shadow hover:shadow-lg transition-shadow">
            <h2 className="text-lg font-semibold text-foreground mb-1">Total</h2>
            <p className="text-xs text-muted-foreground">Snippets</p>
            <p className="text-2xl font-bold mt-2 text-foreground">{totalSnippets}</p>
          </Card>

          <Card className="p-4 w-40 text-center bg-muted shadow hover:shadow-lg transition-shadow">
            <h2 className="text-lg font-semibold text-foreground mb-1">Starred</h2>
            <p className="text-xs text-muted-foreground">Favorites</p>
            <p className="text-2xl font-bold mt-2 text-foreground">{starredSnippets}</p>
          </Card>
        </div>
      </div>
    </div>
  );
};
