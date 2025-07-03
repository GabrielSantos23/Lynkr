import { Loader2 } from "lucide-react";
import { Spinner } from "./ui/Spinner";

export default function Loader() {
  return (
    <div className="flex h-full items-center justify-center">
      <Spinner size="md" />
    </div>
  );
}
