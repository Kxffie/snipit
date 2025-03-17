import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const settingsModules = import.meta.glob("@/components/settings/*.tsx", { eager: true }) as Record<
  string,
  { default: React.ComponentType; settingsMeta: SettingsMeta }
>;

export type SettingsMeta = {
  name: string;
  description: string;
  icon: JSX.Element;
  group?: string;
  order?: number;
  visible?: boolean;
};

type SettingsPage = SettingsMeta & {
  component: React.ComponentType;
};

const settingsPages: SettingsPage[] = Object.entries(settingsModules)
  .map(([, module]) => ({
    ...module.settingsMeta,
    component: module.default,
  }))
  .filter((page) => page.visible !== false);

settingsPages.sort((a, b) => {
  const groupA = a.group || "";
  const groupB = b.group || "";
  if (groupA === groupB) return (a.order || 0) - (b.order || 0);
  return groupA.localeCompare(groupB);
});

export default function Settings() {
  const [activeSection, setActiveSection] = useState(settingsPages[0]?.name || "");

  const renderSidebar = () => {
    const items: React.ReactNode[] = [];
    let lastGroup: string | undefined = undefined;

    settingsPages.forEach((page, idx) => {
      if (lastGroup !== undefined && page.group !== lastGroup) {
        items.push(<Separator key={`sep-${idx}`} className="my-2" />);
      }
      items.push(
        <Button
          key={page.name}
          variant={activeSection === page.name ? "secondary" : "ghost"}
          className="w-full justify-start"
          onClick={() => setActiveSection(page.name)}
        >
          {page.icon}
          <span className="ml-2">{page.name}</span>
        </Button>
      );
      lastGroup = page.group;
    });
    return items;
  };

  const activePage = settingsPages.find((page) => page.name === activeSection);

  return (
    <div className="flex h-full">
      <aside className="w-64 flex-none p-4 border-r">
        <h2 className="text-md font-semibold mb-2 text-muted-foreground">Settings</h2>
        <div className="space-y-2">{renderSidebar()}</div>
      </aside>
      <main className="flex-1 p-6 overflow-auto">
        {activePage ? <activePage.component /> : <p>Select a section</p>}
      </main>
    </div>
  );
}
