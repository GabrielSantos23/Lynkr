import { useDocumentMeta } from "@/lib/utils";

interface DynamicTitleProps {
  title?: string;
  icon?: string;
}

/**
 * A component that dynamically updates the document title and favicon
 * Can be included in any route component to manage document metadata
 */
export function DynamicTitle({ title, icon }: DynamicTitleProps) {
  useDocumentMeta({ title, icon });

  // This component doesn't render anything visible
  return null;
}
