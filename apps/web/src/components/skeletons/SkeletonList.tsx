import { CompactSkeleton } from "./CompactSkeleton";
import { ExpandedSkeleton } from "./ExpandedSkeleton";
import { motion } from "framer-motion";

export const SkeletonList = ({
  viewStyle,
}: {
  viewStyle: "expanded" | "compact";
}) => {
  return (
    <div className="flex flex-col gap-4 sm:gap-6 px-1 sm:px-2 pt-4 sm:pt-6">
      {[...Array<number>(3)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { delay: i * 0.05 } }}
          exit={{ opacity: 0 }}
        >
          {viewStyle === "compact" ? (
            <CompactSkeleton key={i} />
          ) : (
            <ExpandedSkeleton key={i} />
          )}
        </motion.div>
      ))}
    </div>
  );
};
