import { NavLink } from "react-router-dom";
import { Home, SquareDashedBottomCode, Settings, BookKey } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

type PageType = "home" | "snipits" | "secrets" | "settings";

type NavItem =
  | { type: "item"; icon: React.ElementType; page: PageType; label: string }
  | { type: "separator" };

const topNavItems: NavItem[] = [
  { type: "item", icon: Home, page: "home", label: "Home" },
  { type: "item", icon: SquareDashedBottomCode, page: "snipits", label: "Snippets" },
  { type: "item", icon: BookKey, page: "secrets", label: "Secrets" },
  { type: "separator" },
  // Additional top items can be added here
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
      return <Separator key={`sep-${index}`} className="my-2 w-full" />;
    }
    const { icon: Icon, page, label } = navItem;
    const path = mapPageToPath(page);

    return (
      <Tooltip key={page}>
        <TooltipTrigger asChild>
          <NavLink to={path}>
            <Button variant="ghost" size="icon">
              <Icon className="w-4 h-4" />
            </Button>
          </NavLink>
        </TooltipTrigger>
        <TooltipContent>
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    );
  });
}

export default function Sidebar() {
  return (
    <TooltipProvider>
      <nav className="h-full w-16 flex flex-col items-center bg-secondary shadow-md p-2">
        {/* Top section */}
        <div className="flex flex-col items-center gap-4 mt-4">
          {renderNavItems(topNavItems)}
        </div>
        <div className="flex-grow" />
        {/* Bottom section */}
        <div className="flex flex-col items-center gap-4 mb-4">
          {renderNavItems(bottomNavItems)}
        </div>
      </nav>
    </TooltipProvider>
  );
}
