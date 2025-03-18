import { Cable } from "lucide-react";

export const settingsMeta = {
  name: "Telemetry",
  description: "Opt in or out of telemetry settings.",
  icon: <Cable className="w-4 h-4" />,
  group: "Info",
  order: 2,
  visible: false,
};

export default function Telemetry() {
  return (
    <div>
      <h1 className="text-2xl font-bold">{settingsMeta.name}</h1>
      <p className="mb-4">{settingsMeta.description}</p>
      <p>This section displays telemetry options.</p>
      <p>No telemetry is implemented yet.</p>
    </div>
  );
}
