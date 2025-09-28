import { FolderOpen, Plus } from "lucide-react";
import EmptyBoxFillIcon from "./icons/EmptyIcon";
import { useTheme } from "./theme-provider";
const EmptyState = ({
  icon: Icon = FolderOpen,
  title = "No links saved yet",
  description = "Start building your collection by adding your first link to this folder.",
  showAddButton = true,
}) => {
  const { theme } = useTheme();

  const themeColor = theme === "dark" ? "#D3D3D3" : "#A9A9A9";
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="mb-6 p-4  ">
        <EmptyBoxFillIcon
          fill={themeColor as "dark" | "light" | "auto"}
          className="w-[100px] h-[100px] text-muted-foreground"
        />
      </div>
      <h3 className="text-xl font-semibold  text-muted-foreground mb-3">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
        {description}
      </p>
    </div>
  );
};

export default EmptyState;
