"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion, useMotionValue, useTransform } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSnippetsQuery } from "@/lib/SnipItService";
import { Sparkles } from "lucide-react";

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
          className="absolute w-full text-white/60"
          style={{ whiteSpace: "nowrap" }}
        >
          {rotatingLines[index]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

const BackgroundEffects = () => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const backgroundPosition = useTransform(
    [mouseX, mouseY],
    ([x, y]) => `${x}px ${y}px`
  );

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    mouseX.set(e.clientX);
    mouseY.set(e.clientY);
  }

  return (
    <motion.div
      className="absolute inset-0 z-0"
      onMouseMove={handleMouseMove}
      style={{ backgroundPosition }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_var(--x,_--y),_rgba(255,255,255,0.05),_transparent_80%)] pointer-events-none" />
      <motion.div
        className="absolute w-96 h-96 bg-purple-500/20 blur-3xl rounded-full -top-20 -left-20"
        animate={{ rotate: 360 }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute w-96 h-96 bg-pink-500/20 blur-3xl rounded-full -bottom-32 -right-20"
        animate={{ rotate: -360 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      />
    </motion.div>
  );
};

export const Home = () => {
  const { data: snippets = [] } = useSnippetsQuery();

  const totalSnippets = snippets.length;
  const starredSnippets = snippets.filter((s) => s.starred).length;
  const uniqueLanguages = new Set(snippets.map((s) => s.language)).size;

  return (
    <div className="relative min-h-screen w-full px-6 py-12 overflow-hidden bg-gradient-to-br from-[#0f0f11] via-[#101113] to-[#0c0c0e] flex items-center justify-center">
      <BackgroundEffects />

      <div className="relative z-10 w-full max-w-3xl rounded-2xl p-8 border border-white/10 bg-white/5 backdrop-blur-lg shadow-[0_0_30px_rgba(0,0,0,0.2)]">
        <div className="flex flex-col items-center text-center gap-4">
          <img
            src="SnipIt-logo-long.png"
            alt="SnipIt Logo"
            className="w-64 sm:w-80 md:w-96 h-auto"
          />
          <div className="text-lg sm:text-xl font-medium text-white/70">
            <RotatingText />
          </div>
          <p className="text-sm text-white/50 max-w-xl mt-2">
            Welcome to your personal snippet space. Start building, organizing, and
            searching your code library — offline, forever.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4 mt-8">
          <Button className="w-40" onClick={() => console.log("new snippet")}>+ New Snippet</Button>
          <Button variant="outline" className="w-40" onClick={() => console.log("manage collections")}>Manage Collections</Button>
        </div>

        <div className="flex flex-wrap justify-center gap-4 mt-8">
          <Card className="p-4 w-40 text-center bg-white/10 backdrop-blur border border-white/10 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold text-white mb-1">Total</h2>
            <p className="text-xs text-white/60">Snippets</p>
            <p className="text-2xl font-bold mt-2 text-white">{totalSnippets}</p>
          </Card>

          <Card className="p-4 w-40 text-center bg-white/10 backdrop-blur border border-white/10 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold text-white mb-1">Starred</h2>
            <p className="text-xs text-white/60">Favorites</p>
            <p className="text-2xl font-bold mt-2 text-white">{starredSnippets}</p>
          </Card>

          <Card className="p-4 w-40 text-center bg-white/10 backdrop-blur border border-white/10 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold text-white mb-1">Languages</h2>
            <p className="text-xs text-white/60">Used</p>
            <p className="text-2xl font-bold mt-2 text-white">{uniqueLanguages}</p>
          </Card>
        </div>
      </div>
    </div>
  );
};