import { FolderOpen, Plus } from "lucide-react";

const EmptyState = ({
  icon: Icon = FolderOpen,
  title = "No links saved yet",
  description = "Start building your collection by adding your first link to this folder.",
  showAddButton = true,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="mb-6 p-4  ">
        <Icon className="h-12 w-12 text-muted-foreground" />
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
