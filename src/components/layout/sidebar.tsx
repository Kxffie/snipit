import { NavLink } from "react-router-dom";
import { Home, SquareDashedBottomCode, Settings, BookKey } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";

type PageType = "home" | "snipits" | "secrets" | "settings";

type NavItem =
  | { type: "item"; icon: React.ElementType; page: PageType; label: string }
  | { type: "separator" };

const topNavItems: NavItem[] = [
  { type: "item", icon: Home, page: "home", label: "Home" },
  { type: "item", icon: SquareDashedBottomCode, page: "snipits", label: "Snippets" },
  { type: "item", icon: BookKey, page: "secrets", label: "Secrets" },
  { type: "separator" },
];

const bottomNavItems: NavItem[] = [
  { type: "item", icon: Settings, page: "settings", label: "Settings" },
];

function mapPageToPath(page: PageType): string {
  switch (page) {
    case "home":
      return "/";
    case "snipits":
      return "/snipits";
    case "secrets":
      return "/secrets";
    case "settings":
      return "/settings";
    default:
      return "/";
  }
}

function renderNavItems(items: NavItem[]) {
  return items.map((navItem, index) => {
    if (navItem.type === "separator") {
      return <Separator key={`sep-${index}`} className="my-2 w-full bg-white/10" />;
    }

    const { icon: Icon, page, label } = navItem;
    const path = mapPageToPath(page);

    return (
      <Tooltip key={page}>
        <TooltipTrigger asChild>
          <NavLink
            to={path}
            className={({ isActive }) =>
              `group relative flex items-center justify-center rounded-lg p-2 transition hover:bg-white/10 ${
                isActive ? "ring-2 ring-white/30 bg-white/10" : ""
              }`
            }
          >
            <Icon className="w-5 h-5 text-white group-hover:text-accent transition" />
          </NavLink>
        </TooltipTrigger>
        <TooltipContent side="right" className="text-white text-xs shadow-xl shadow-black/30 bg-white/10 backdrop-blur-sm border border-white/10">
          {label}
        </TooltipContent>
      </Tooltip>
    );
  });
}

export default function Sidebar() {
  return (
    <TooltipProvider>
      <nav className="h-full w-16 flex flex-col items-center justify-between bg-white/5 backdrop-blur-lg border-r border-white/10 shadow-lg py-4">
        {/* Top section */}
        <div className="flex flex-col items-center gap-3">{renderNavItems(topNavItems)}</div>

        {/* Bottom section */}
        <div className="flex flex-col items-center gap-3">{renderNavItems(bottomNavItems)}</div>
      </nav>
    </TooltipProvider>
  );
}
