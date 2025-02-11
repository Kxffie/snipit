import { Home, SquareDashedBottomCode , Settings, Users, Trash, BookMarked } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";


type PageType = "home" | "snipits" | "settings";

type NavItem =
  | { type: "item"; icon: React.ElementType; page: PageType, label: string }
  | { type: "separator" };

// Top items
const topNavItems: NavItem[] = [
  { type: "item", icon: Home, page: "home", label: "Home" },
  { type: "item", icon: SquareDashedBottomCode, page: "snipits", label: "Snippets" },
  { type: "separator" },
  { type: "item", icon: Users, page: "home", label: "Users" },
  { type: "item", icon: BookMarked, page: "home", label: "Docs" },
];

const bottomNavItems: NavItem[] = [
  { type: "item", icon: Trash, page: "home", label: "Trash" },
  { type: "item", icon: Settings, page: "settings", label: "Settings" },
];

type SidebarProps = {
  setActivePage: (page: PageType) => void;
};


function renderNavItems(items: NavItem[], setActivePage: (page: PageType) => void) {
  return items.map((navItem, index) => {
    if (navItem.type === "separator") {
      return <Separator key={`sep-${index}`} className="my-2 w-full" />;
    }
    // It's a nav item
    const { icon: Icon, page, label } = navItem;

    return (
      <Tooltip key={page}>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" onClick={() => setActivePage(page)}>
            <Icon className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    );
  });
}


export default function Sidebar({ setActivePage }: SidebarProps) {
  return (
    <TooltipProvider>
      <nav className="h-full w-16 flex flex-col items-center bg-secondary shadow-md p-2">
        {/* Top section */}
        <div className="flex flex-col items-center gap-4 mt-4">
          {renderNavItems(topNavItems, setActivePage)}
        </div>
        <div className="flex-grow" />
        {/* Bottom section */}
        <div className="flex flex-col items-center gap-4 mb-4">
          {renderNavItems(bottomNavItems, setActivePage)}
        </div>
      </nav>
    </TooltipProvider>
  );
}
