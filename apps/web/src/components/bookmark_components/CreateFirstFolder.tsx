import { useAtom } from "jotai";
import { isNewFolderModalOpenAtom } from "../helpers/atoms";
import CreateFolder from "./CreateFolder";
import { motion } from "framer-motion";

export default function CreateFirstFolder() {
  const [, setIsNewFolderModalOpen] = useAtom(isNewFolderModalOpenAtom);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center mt-8"
    >
      <div className="max-w-md w-full">
        <div className="text-center mb-6">
          <h2 className="text-xl font-medium">Create your first folder</h2>
          <p className="text-muted-foreground mt-2">
            Create a folder to start saving your bookmarks
          </p>
        </div>
        <CreateFolder onSuccess={() => setIsNewFolderModalOpen(false)} />
      </div>
    </motion.div>
  );
}
