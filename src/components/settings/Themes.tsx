import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTheme } from "@/components/theme-provider";
import { Palette } from "lucide-react";

export const settingsMeta = {
  name: "Themes",
  description: "Customize your theme and appearance settings.",
  icon: <Palette className="w-4 h-4" />,
  group: "Main",
  order: 1,
  visible: true,
};

export default function Themes() {
  const { theme, setTheme } = useTheme();
  return (
    <div>
      <h1 className="text-2xl font-bold">{settingsMeta.name}</h1>
      <p className="mb-4">{settingsMeta.description}</p>
      <Select value={theme} onValueChange={(value) => setTheme(value as "light" | "dark" | "system")}>
        <SelectTrigger className="w-64">
          <SelectValue placeholder="Select Theme" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="light">☀️ Light</SelectItem>
          <SelectItem value="dark">🌙 Dark</SelectItem>
          <SelectItem value="system">🖥 System</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
