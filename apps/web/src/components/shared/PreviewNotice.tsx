import { Eye } from "lucide-react";

export function PreviewNotice({ live }: { live: boolean }) {
  if (live) return null;

  return (
    <p className="flex items-center gap-2 text-xs font-medium text-foreground-muted">
      <Eye aria-hidden="true" className="h-4 w-4" />
      Preview data
    </p>
  );
}
