import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Bookmark } from "@/types/bookmark";

interface Tag {
  name: string;
  color: string;
}

const PRESET_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#64748b", // slate
  "#78716c", // stone
];

export default function TagDialog({
  bookmark,
  open,
  onOpenChange,
}: {
  bookmark: Bookmark;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [tags, setTags] = useState<Tag[]>(bookmark.tags ?? []);
  const [newName, setNewName] = useState("");
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const queryClient = useQueryClient();

  const { mutate: saveTags, isPending } = useMutation({
    mutationFn: async (updated: Tag[]) => {
      await fetch(`/api/bookmarks/${bookmark.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: updated }),
      }).then((res) => {
        if (!res.ok) throw new Error("Failed");
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
      queryClient.invalidateQueries({ queryKey: ["pinnedBookmarks"] });
      onOpenChange(false);
    },
  });

  const canAdd =
    tags.length < 4 && newName.trim().length > 0 && !/\s/.test(newName);

  const addTag = () => {
    if (canAdd) {
      setTags([...tags, { name: newName.trim(), color: selectedColor }]);
      setNewName("");
    }
  };

  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 w-96 -translate-x-1/2 -translate-y-1/2 rounded-xl bg-card border border-border p-6 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-foreground">Tags</h2>
            <Dialog.Close asChild>
              <button className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          {/* Current Tags */}
          <div className="space-y-3 mb-6">
            {tags.map((tag, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full border"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="font-medium text-foreground">
                    {tag.name}
                  </span>
                </div>
                <button
                  onClick={() => removeTag(idx)}
                  className="text-muted-foreground hover:text-red-500 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Add New Tag */}
          {tags.length < 4 && (
            <div className="space-y-4 mb-6">
              <div className="flex gap-2">
                <Input
                  placeholder="Tag name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="flex-1"
                  onKeyDown={(e) => e.key === "Enter" && addTag()}
                />
                <Button
                  onClick={addTag}
                  disabled={!canAdd}
                  size="sm"
                  className="px-3"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Color Picker */}
              <div className="flex gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      selectedColor === color
                        ? "border-foreground scale-110"
                        : "border-border hover:border-muted-foreground"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Dialog.Close asChild>
              <Button variant="outline">Cancel</Button>
            </Dialog.Close>
            <Button onClick={() => saveTags(tags)} disabled={isPending}>
              {isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
