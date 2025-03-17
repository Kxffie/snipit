import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Clipboard } from "lucide-react";

export const settingsMeta = {
  name: "Test",
  description: "A sandbox for various settings.",
  icon: <Clipboard className="w-4 h-4" />,
  group: "Misc",
  order: 2,
  visible: false,
};

export default function Test() {
  const { toast } = useToast();
  return (
    <div>
      <h1 className="text-2xl font-bold">{settingsMeta.name}</h1>
      <p className="mb-4">{settingsMeta.description}</p>
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => toast({ title: "Info", description: "This is an info toast." })}>
          Show Info Toast
        </Button>
        <Button variant="destructive" onClick={() => toast({ title: "Error", description: "This is an error toast.", variant: "destructive" })}>
          Show Error Toast
        </Button>
        <Button variant="secondary" onClick={() => toast({ title: "Success", description: "This is a success toast." })}>
          Show Success Toast
        </Button>
        <Button variant="ghost" onClick={() => console.log("Test button clicked!")}>
          Log to Console
        </Button>
      </div>
    </div>
  );
}
