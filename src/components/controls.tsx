import { open } from "@tauri-apps/api/dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/api/fs";
import { useAtom } from "jotai";
import { UploadIcon, SaveIcon } from "lucide-react";

import { editorTextAtom, fileUrlAtom } from "@/atoms";

import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";

export const Controls = () => {
  const [editorText, setEditorText] = useAtom(editorTextAtom);
  const [fileUrl, setFileUrl] = useAtom(fileUrlAtom);

  return (
    <div className="w-[50px]">
      <div className="grid gap-2 justify-center items-center py-2">
        <ModeToggle />
        <Button
          variant="outline"
          size="icon"
          onClick={async (e) => {
            e.preventDefault();
            const path = await open({
              title: "Open Markdown File",
              filters: [
                {
                  name: "Select only markdown files",
                  extensions: ["md"],
                },
              ],
              multiple: false,
            });

            if (!path || typeof path !== "string") {
              return;
            }

            const content = await readTextFile(path);

            setFileUrl(path);
            setEditorText(content);
          }}
        >
          <UploadIcon className="h-[1.2rem] w-[1.2rem] transition-all" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={async (e) => {
            e.preventDefault();
            await writeTextFile(fileUrl, editorText);
          }}
        >
          <SaveIcon className="h-[1.2rem] w-[1.2rem] transition-all" />
        </Button>
      </div>
    </div>
  );
};
