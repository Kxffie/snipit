import { Button } from "@/components/ui/button";
import { MessageCircle, Twitter, Youtube, Github } from "lucide-react";
import { open } from "@tauri-apps/api/shell";

export const settingsMeta = {
  name: "Network",
  description: "Connect with us on social media and other platforms.",
  icon: <MessageCircle className="w-4 h-4" />,
  group: "Main",
  order: 4,
  visible: true,
};

export default function Network() {
  return (
    <div>
      <h1 className="text-2xl font-bold">{settingsMeta.name}</h1>
      <p className="mb-4">{settingsMeta.description}</p>
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        <Button variant="outline" className="flex items-center justify-center gap-2 p-4" onClick={() => open("https://discord.gg/sx34u9ExYU")}>
          <MessageCircle className="w-6 h-6" />
          <span>Discord</span>
        </Button>
        <Button variant="outline" className="flex items-center justify-center gap-2 p-4" onClick={() => open("https://github.com/Kxffie/snipit")}>
          <Github className="w-6 h-6" />
          <span>GitHub</span>
        </Button>
      </div>
    </div>
  );
}
