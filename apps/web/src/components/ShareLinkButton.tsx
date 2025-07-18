import { motion } from "framer-motion";
import { CheckIcon, Share2Icon } from "lucide-react";
import { useState } from "react";

export const ShareLinkButton = ({ folderId }: { folderId: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyToClipboard = async () => {
    const url =
      "https://" + window.location.hostname + "/bookmarks/public/" + folderId;
    await navigator.clipboard.writeText(url);

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 3000);
  };

  return (
    <motion.button
      whileTap={{
        scale: 0.95,
      }}
      onClick={() => {
        void handleCopyToClipboard();
      }}
      className="rounded-full dark:bg-white/10 bg-black/10 p-3 font-semibold dark:text-white text-black no-underline transition dark:hover:bg-white/20 hover:bg-black/20"
    >
      {copied ? (
        <motion.div
          key="copied"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
        >
          <CheckIcon className="h-4 w-4" />
        </motion.div>
      ) : (
        <motion.div
          key="notCopied"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
        >
          <Share2Icon className="h-4 w-4" />
        </motion.div>
      )}
    </motion.button>
  );
};
