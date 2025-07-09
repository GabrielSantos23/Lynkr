import { useDocumentMeta } from "@/lib/utils";

interface DynamicTitleProps {
  title?: string;
  icon?: string;
}

export function DynamicTitle({ title, icon }: DynamicTitleProps) {
  useDocumentMeta({ title, icon });

  return null;
}
