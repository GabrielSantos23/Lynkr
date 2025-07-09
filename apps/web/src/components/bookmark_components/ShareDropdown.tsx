import * as Popover from "@radix-ui/react-popover";
import { motion } from "framer-motion";
import { useAtom } from "jotai";
import {
  Link2,
  Mail,
  Share,
  Globe,
  Lock,
  LockOpen,
  Clipboard,
  ClipboardCheck,
  Check,
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { Hotkey } from "./Hotkey";
import {
  currentFolderAtom,
  foldersAtom,
  openHeaderPopoverAtom,
} from "../helpers/atoms";
import { Separator } from "../ui/separator";
import { Checkbox } from "../ui/checkbox";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTour } from "../guided-tour";

const shareOptions = [
  {
    label: "Copy link",
    icon: <Link2 className="h-4 w-4" />,
    value: "copy",
  },
  {
    label: "Share via email",
    icon: <Mail className="h-4 w-4" />,
    value: "email",
  },
];

export const ShareDropdown = () => {
  const [openHeaderPopover, setOpenHeaderPopover] = useAtom(
    openHeaderPopoverAtom
  );
  const popoverOpen = openHeaderPopover === "share";
  const [folders] = useAtom(foldersAtom);
  const [currentFolder, setCurrentFolder] = useAtom(currentFolderAtom);
  const [copied, setCopied] = useState(false);
  const queryClient = useQueryClient();
  const { isActive, currentStepId } = useTour();

  const { mutate: toggleShare, isPending } = useMutation({
    mutationFn: async (newValue: boolean) => {
      if (!currentFolder) return;

      const res = await fetch(`/api/folders/${currentFolder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isShared: newValue }),
      });

      if (!res.ok) {
        throw new Error("Failed to update share status");
      }

      return res.json();
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      setCurrentFolder(updated);
    },
  });

  const shareUrl = currentFolder
    ? `${window.location.origin}/bookmarks/public/${currentFolder.id}`
    : window.location.href;

  const handleShare = (value: string) => {
    if (value === "copy") {
      navigator.clipboard.writeText(shareUrl);
    } else if (value === "email") {
      window.open(
        `mailto:?subject=Check out this folder&body=${encodeURIComponent(
          shareUrl
        )}`
      );
    }
    setOpenHeaderPopover(null);
  };

  useEffect(() => {
    if (isActive && currentStepId === "share-dropdown") {
      setOpenHeaderPopover("share");
    } else {
      setOpenHeaderPopover(null);
    }
  }, [isActive, currentStepId, setOpenHeaderPopover]);

  return (
    <Popover.Root
      open={popoverOpen}
      onOpenChange={(open) => setOpenHeaderPopover(open ? "share" : null)}
    >
      <Popover.Trigger asChild>
        <button
          className="text-md inline-flex cursor-pointer items-center justify-between rounded-full focus:outline-none p-3 bg-accent/50 backdrop-blur-md group"
          aria-label="Share"
          type="button"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-x-2"
          >
            <Share className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
          </motion.div>
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          sideOffset={10}
          alignOffset={-10}
          className="rounded-lg border border-black/10 bg-black/5 p-1 align-middle text-sm text-black no-underline backdrop-blur-lg dark:border-white/10 dark:bg-white/5 dark:text-white min-w-[250px]"
        >
          <div className="flex flex-col gap-y-2 px-4">
            <div className="flex items-center gap-x-2 justify-between">
              <div className="flex items-center gap-x-2 py-1">
                <Globe className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                <span
                  className={`${
                    currentFolder?.isShared
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  Share
                </span>
              </div>
              <span className="relative flex h-2 w-2 ml-2">
                <span
                  className={`absolute inline-flex h-full w-full ${
                    currentFolder?.isShared
                      ? "animate-ping bg-green-500"
                      : "bg-muted-foreground"
                  }  rounded-full opacity-75 transition duration-200 ease-in-out`}
                />
                <span
                  className={`relative inline-flex h-2 w-2 rounded-full transition duration-200 ease-in-out ${
                    currentFolder?.isShared
                      ? "bg-green-500"
                      : "bg-muted-foreground"
                  }`}
                />
              </span>
            </div>
          </div>
          <Separator className="my-2" />
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <label className="flex px-4 py-2 cursor-pointer items-center justify-between">
              <div className="flex items-center gap-x-2">
                {currentFolder?.isShared ? (
                  <LockOpen className="text-muted-foreground w-4 h-4" />
                ) : (
                  <Lock className="text-muted-foreground w-4 h-4" />
                )}
                <span
                  className={`${
                    currentFolder?.isShared
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {currentFolder?.isShared ? "Public" : "Private"}
                </span>
              </div>
              <Checkbox
                className="dark:bg-accent dark:border-accent bg-accent border-accent"
                checked={currentFolder?.isShared}
                disabled={isPending || !currentFolder}
                onCheckedChange={(checked) => {
                  if (!currentFolder) return;
                  const newValue = Boolean(checked);
                  toggleShare(newValue);
                }}
              />
            </label>
            <div className="flex flex-col gap-y-2 px-4 py-2">
              <label
                htmlFor="magic-link"
                className="text-muted-foreground text-sm"
              >
                Here's your magic link:
              </label>
              <div className="flex items-center gap-x-2">
                <Input
                  type="text"
                  id="magic-link"
                  className="w-full rounded-md border border-black/10 bg-black/5 p-2 text-sm text-black no-underline backdrop-blur-lg dark:border-white/10 dark:bg-white/5 dark:text-white"
                  value={shareUrl}
                  readOnly
                  disabled={!currentFolder?.isShared}
                />
                <Button
                  className="w-10 rounded-md border border-black/10 bg-black/5 p-2 text-sm text-black no-underline backdrop-blur-lg dark:border-white/10 dark:bg-white/5 dark:text-white"
                  size="icon"
                  onClick={() => {
                    navigator.clipboard.writeText(shareUrl);
                    setCopied(true);
                    toast.success("Copied to clipboard");
                    setTimeout(() => {
                      setCopied(false);
                    }, 2000);
                  }}
                  variant="outline"
                  disabled={!currentFolder?.isShared}
                >
                  {copied ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Link2 className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};
