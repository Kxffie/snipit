import { useQuery } from "@tanstack/react-query";
import { loadSettings } from "@/db/db";
import { os, app, path as tauriPath } from "@tauri-apps/api";
import { Separator } from "@/components/ui/separator";
import { Library } from "lucide-react";

export const settingsMeta = {
  name: "About",
  description: "Information about the app, your device, and integrations.",
  icon: <Library className="w-4 h-4" />,
  group: "Info",
  order: 1,
  visible: true,
};

export default function About() {
  const { data: systemInfo } = useQuery({
    queryKey: ["systemInfo"],
    queryFn: async () => {
      const settings = await loadSettings();
      return {
        appDirectory: await tauriPath.appDataDir(),
        osDetails: `${await os.platform()} ${await os.version()}`,
        arch: await os.arch(),
        appVersion: await app.getVersion(),
        tauriVersion: await app.getTauriVersion(),
        firstStartup: settings?.firstStartup ? new Date(settings.firstStartup).toLocaleString() : "",
      };
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">{settingsMeta.name}</h1>
      <p className="mb-4">{settingsMeta.description}</p>
      <div className="space-y-4 w-96">
        <div>
          <h3 className="text-md font-semibold mb-2 text-muted-foreground">System Information</h3>
          <Separator className="my-2" />
          <p><strong>Operating System:</strong> {systemInfo?.osDetails || "Loading..."}</p>
          <p><strong>Architecture:</strong> {systemInfo?.arch || "Loading..."}</p>
          <p><strong>First Opened:</strong> {systemInfo?.firstStartup || "Loading..."}</p>
        </div>
        <div>
          <h3 className="text-md font-semibold mb-2 text-muted-foreground">App Information</h3>
          <Separator className="my-2" />
          <p><strong>App Version:</strong> {systemInfo?.appVersion || "Loading..."}</p>
          <p><strong>Tauri Version:</strong> {systemInfo?.tauriVersion || "Loading..."}</p>
        </div>
        <div>
          <h3 className="text-md font-semibold mb-2 text-muted-foreground">Storage Paths</h3>
          <Separator className="my-2" />
          <p><strong>App Directory:</strong> {systemInfo?.appDirectory || "Loading..."}</p>
        </div>
      </div>
    </div>
  );
}
