import { Home, FileText, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

type PageType = "home" | "snipits" | "settings";

type SidebarProps = {
  setActivePage: (page: PageType) => void;
};

export default function Sidebar({ setActivePage }: SidebarProps) {
  const navItems: { icon: React.ElementType; page: PageType }[] = [
    { icon: Home, page: "home" },
    { icon: FileText, page: "snipits" },
  ];

  return (
    <nav className="h-full w-16 flex flex-col items-center bg-secondary shadow-md p-2">
      <div className="flex flex-col items-center gap-4 mt-4">
        {navItems.map(({ icon: Icon, page }) => (
          <Button key={page} variant="ghost" size="icon" onClick={() => setActivePage(page)}>
            <Icon className="w-6 h-6" />
          </Button>
        ))}
      </div>
      <div className="flex-grow" />
      <Button variant="ghost" size="icon" className="mb-4" onClick={() => setActivePage("settings")}>
        <Settings className="w-6 h-6" />
      </Button>
    </nav>
  );
}
