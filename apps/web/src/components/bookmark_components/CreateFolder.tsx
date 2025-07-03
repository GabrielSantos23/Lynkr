import { FolderIcon, X } from "lucide-react";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import { Hotkey } from "./Hotkey";
import Picker from "@emoji-mart/react";
import { useState, useRef, useEffect } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import Loader from "../loader";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";

interface CreateFolderProps {
  onSuccess?: () => void;
}

export default function CreateFolder({ onSuccess }: CreateFolderProps) {
  const [icon, setIcon] = useState<string>("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const [name, setName] = useState<string>("");
  const queryClient = useQueryClient();

  const { data: session } = authClient.useSession();

  const { mutateAsync: createFolder, isPending } = useMutation({
    mutationFn: async () => {
      if (!session?.user?.id) {
        throw new Error("Not authenticated");
      }

      const res = await fetch("/api/folders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: name.trim(),
          icon: icon.trim(),
          userId: session.user.id,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message ?? "Failed to create folder");
      }

      return res.json();
    },
    onSuccess: () => {
      // Refresh folders list
      queryClient.invalidateQueries({ queryKey: ["folders"] });

      // Reset form
      setName("");
      setIcon("");

      // Notify parent to close modal if provided
      onSuccess?.();
    },
  });

  const Icon = icon ? (
    <span className="text-xl">{icon}</span>
  ) : (
    <FolderIcon className="w-4 h-4 text-muted-foreground" />
  );

  // Close picker when clicking outside
  useEffect(() => {
    if (!pickerOpen) return;
    function handleClick(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [pickerOpen]);

  return (
    <div className="bg-card/50 backdrop-blur-md py-4 px-6 rounded-lg border-border border-2">
      <div className="flex items-center gap-x-2 ">
        <span className="text-muted-foreground">New folder</span>
        <Hotkey key1="n" />
      </div>
      <div className="flex items-center gap-x-2 mt-2">
        <Separator />
      </div>
      <div className="mt-4 flex gap-x-2">
        <div className="mt-1">
          <Label className="text-muted-foreground mb-2 text-sm">Icon</Label>
          <div className="flex items-center gap-x-2 relative">
            <div
              className="bg-card w-10 h-10 rounded-lg flex items-center justify-center cursor-pointer"
              onClick={() => setPickerOpen((open) => !open)}
            >
              {Icon}
            </div>
            {pickerOpen && (
              <div
                ref={pickerRef}
                className="absolute left-0 top-12 z-50"
                style={{ minWidth: "250px" }}
              >
                <Picker
                  onEmojiSelect={(emoji: any) => {
                    setIcon(emoji.native);
                    setPickerOpen(false);
                  }}
                  theme="auto"
                  autoFocus
                />
              </div>
            )}
            {icon && (
              <div
                className="bg-card w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer"
                onClick={() => setIcon("")}
                title="Remove icon"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </div>
            )}
          </div>
        </div>
        <div className="mt-1">
          <Label className="text-muted-foreground mb-2 text-sm">Name*</Label>
          <Input
            placeholder="Folder name"
            className="border-none select-none focus-visible:ring-0 focus-visible:ring-offset-0 "
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={30}
          />
        </div>
      </div>
      <div className="mt-4 flex gap-x-2 justify-end ">
        <Button
          className="w-full rounded-lg "
          variant="outline"
          disabled={!name.trim() || isPending}
          onClick={() => {
            if (!name.trim()) return;
            createFolder();
          }}
        >
          {isPending ? <Loader /> : "Create"}
        </Button>
      </div>
    </div>
  );
}
