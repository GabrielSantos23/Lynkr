import * as Popover from "@radix-ui/react-popover";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect } from "react";
import {
  Settings,
  Menu,
  RowsIcon,
  SunIcon,
  MoonIcon,
  CalendarIcon,
  LayoutIcon,
  CheckIcon,
  CopyIcon,
  Columns3,
  Zap,
  LogOut,
} from "lucide-react";
import { Separator } from "../ui/separator";
import { toast } from "sonner";
import { Hotkey } from "./Hotkey";
import { authClient } from "@/lib/auth-client";
import { Navigate } from "@tanstack/react-router";
import * as ToggleGroup from "@radix-ui/react-toggle-group";
import * as Checkbox from "@radix-ui/react-checkbox";
import { Spinner } from "../ui/Spinner";
import { useProfileHotkeys } from "./useHotkeys";
import { useTheme } from "../theme-provider";
import { useTour } from "../guided-tour";

export const ProfileDropdown = () => {
  const [signOutChecked, setSignOutChecked] = useState(false);
  const { data: session } = authClient.useSession();
  const [open, setOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { isActive, currentStepId } = useTour();

  const {
    handleUpdateFolder,
    handleChangeViewStyle,
    handleUpdateShowMonths,
    handleThemeToggle,
    currentFolder,
    viewStyle,
    showMonths,
  } = useProfileHotkeys();

  useEffect(() => {
    if (isActive && currentStepId === "profile-dropdown") {
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [isActive, currentStepId]);

  const handleSignOut = () => {
    setSignOutChecked(true);
    setOpen(false);

    authClient.signOut();
    Navigate({ to: "/" });
    toast.success("Signed out");

    setTimeout(() => setSignOutChecked(false), 1500);
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <motion.button
          whileTap={{
            scale: 0.95,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="rounded-full bg-black/10 p-2 text-black no-underline transition hover:bg-black/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
        >
          <div className="flex items-center gap-x-2 align-middle">
            {session?.user?.image ? (
              <img
                src={session?.user?.image}
                width={24}
                height={24}
                className="rounded-full"
                alt="Profile Picture"
              />
            ) : (
              <div className="h-6 w-6 rounded-full  bg-black/20 dark:bg-white/20" />
            )}
          </div>
        </motion.button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content className="z-50 mr-6 md:mr-12">
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 sm:w-80 w-64 flex flex-col gap-3 rounded-md border border-black/10 bg-black/5 p-4 align-middle font-semibold text-black no-underline backdrop-blur-lg dark:border-white/10 dark:bg-white/5 dark:text-white"
          >
            <div className="flex items-center gap-2 px-1 align-middle">
              <div className="flex items-center gap-2 align-middle">
                <Settings className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                <p className="text-sm font-normal">Settings</p>
              </div>
            </div>
            <Separator />
            <div className="flex flex-col gap-4 px-1">
              <div className="flex items-center justify-between gap-x-2 pt-2 align-middle">
                <div className="flex items-center gap-x-3 align-middle">
                  <AnimatePresence mode="popLayout">
                    {viewStyle === "compact" ? (
                      <motion.div
                        key="compact"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                      >
                        <Menu className="h-4 w-4 text-muted-foreground" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="expanded"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                      >
                        <RowsIcon className="h-4 w-4 text-muted-foreground" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <p className="text-sm font-normal">View</p>
                  <Hotkey key1="v" />
                </div>
                <ToggleGroup.Root
                  type="single"
                  defaultValue={viewStyle}
                  className="flex items-center gap-x-2 align-middle"
                  onValueChange={(value) => {
                    if (value !== viewStyle && value !== "") {
                      handleChangeViewStyle(value as "compact" | "expanded");
                    }
                  }}
                >
                  <ToggleGroup.Item
                    value="compact"
                    className="flex items-center gap-x-2 align-middle"
                  >
                    <p
                      className={`text-sm transition duration-200 ease-in-out hover:text-black dark:hover:text-white ${
                        viewStyle === "compact"
                          ? "font-semibold"
                          : "font-normal text-muted-foreground"
                      }`}
                    >
                      Compact
                    </p>
                  </ToggleGroup.Item>
                  <ToggleGroup.Item
                    value="expanded"
                    className="flex items-center gap-x-2 align-middle"
                  >
                    <p
                      className={`text-sm transition duration-200 ease-in-out hover:text-black dark:hover:text-white ${
                        viewStyle === "expanded"
                          ? "font-semibold"
                          : "font-normal text-muted-foreground"
                      }`}
                    >
                      Expanded
                    </p>
                  </ToggleGroup.Item>
                </ToggleGroup.Root>
              </div>

              <div className="flex flex-row justify-between align-middle">
                <div className="flex items-center gap-x-3 align-middle">
                  <AnimatePresence mode="popLayout">
                    {theme === "light" ? (
                      <motion.div
                        key="light"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                      >
                        <SunIcon className="h-4 w-4 text-muted-foreground" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="dark"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                      >
                        <MoonIcon className="h-4 w-4 text-muted-foreground" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <p className="text-sm font-normal">Day or night</p>
                  <Hotkey key1="t" />
                </div>
                <ToggleGroup.Root
                  type="single"
                  defaultValue={theme}
                  className="flex items-center gap-x-2 align-middle"
                  onValueChange={(value) => {
                    if (value !== theme && value !== "") {
                      handleThemeToggle();
                    }
                  }}
                >
                  <ToggleGroup.Item
                    value="light"
                    className="flex items-center gap-x-2 align-middle"
                  >
                    <p
                      className={`text-sm transition duration-200 ease-in-out hover:text-black dark:hover:text-white ${
                        theme === "light"
                          ? "font-semibold"
                          : "font-normal text-muted-foreground"
                      }`}
                    >
                      Day
                    </p>
                  </ToggleGroup.Item>
                  <ToggleGroup.Item
                    value="dark"
                    className="flex items-center gap-x-2 align-middle"
                  >
                    <p
                      className={`text-sm transition duration-200 ease-in-out hover:text-black dark:hover:text-white ${
                        theme === "dark"
                          ? "font-semibold"
                          : "font-normal text-muted-foreground"
                      }`}
                    >
                      Night
                    </p>
                  </ToggleGroup.Item>
                </ToggleGroup.Root>
              </div>

              <div className="flex items-center justify-between gap-x-2 align-middle">
                <div className="flex items-center gap-x-3 align-middle">
                  <AnimatePresence mode="popLayout">
                    {showMonths ? (
                      <motion.div
                        key="showMonths"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                      >
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="notShowMonths"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                      >
                        <LayoutIcon className="h-4 w-4 rotate-90 text-muted-foreground" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <p className="text-sm font-normal">Show months?</p>
                  <Hotkey key1="m" />
                </div>
                <Checkbox.Root
                  checked={showMonths}
                  className="flex h-6 w-6 items-center justify-center rounded-md bg-black/10 transition  duration-200 ease-in-out hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20 "
                  onCheckedChange={() => {
                    handleUpdateShowMonths();
                  }}
                >
                  <motion.div
                    whileTap={{
                      scale: 0.8,
                    }}
                  >
                    <Checkbox.Indicator>
                      <CheckIcon className="h-4 w-4" />
                    </Checkbox.Indicator>
                  </motion.div>
                </Checkbox.Root>
              </div>

              <div className="flex items-center justify-between gap-x-2 align-middle">
                <div className="flex items-center gap-x-3 align-middle">
                  <AnimatePresence mode="popLayout">
                    {currentFolder?.allowDuplicate ? (
                      <motion.div
                        key="allowDuplicate"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                      >
                        <CopyIcon className="h-4 w-4 text-muted-foreground" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="notAllowDuplicate"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                      >
                        <Columns3 className="h-4 w-4 text-muted-foreground" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <p className="text-sm font-normal">Allow duplicates?</p>
                  <Hotkey key1="d" />
                </div>
                <Checkbox.Root
                  checked={currentFolder?.allowDuplicate}
                  className="flex h-6 w-6 items-center justify-center rounded-md bg-black/10 transition  duration-200 ease-in-out hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20 "
                  onCheckedChange={() => {
                    handleUpdateFolder();
                  }}
                >
                  <motion.div
                    whileTap={{
                      scale: 0.95,
                    }}
                  >
                    <Checkbox.Indicator>
                      <CheckIcon className="h-4 w-4" />
                    </Checkbox.Indicator>
                  </motion.div>
                </Checkbox.Root>
              </div>

              <div className="flex items-center justify-between gap-x-2 pb-1 align-middle">
                <div className="flex items-center gap-x-3 align-middle">
                  <LogOut className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-normal">Sign out</p>
                </div>
                <motion.button
                  whileTap={{
                    scale: 0.95,
                  }}
                  disabled={signOutChecked}
                  onClick={handleSignOut}
                  className={`flex h-6 w-6 items-center justify-center rounded-md bg-black/10 font-semibold text-black no-underline transition ease-in-out hover:bg-black/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/20  `}
                >
                  {signOutChecked ? (
                    <Spinner size="sm" />
                  ) : (
                    <p className="text-xs font-normal ">{"->"}</p>
                  )}
                </motion.button>
              </div>
            </div>
            <Separator />
            <div className="flex items-center gap-x-3 px-1 align-middle">
              <Zap className="h-4 w-4 text-muted-foreground " />

              <div className="flex flex-col gap-1.5">
                <p className="text-sm font-semibold">Pro tip </p>
                <div className="flex items-center gap-1.5 align-middle">
                  <span className="text-sm font-normal text-muted-foreground ">
                    Press
                  </span>
                  <Hotkey key1="f" />
                  <p className="text-sm font-normal text-muted-foreground">
                    to open Folders
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};
