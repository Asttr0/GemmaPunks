import { Eye, Wifi } from "lucide-react";

export function PreviewNotice({ live }: { live: boolean }) {
  return (
    <div
      className={
        live
          ? "flex items-center gap-2 rounded-control border border-emerald-200 bg-success-subtle px-4 py-3 text-sm font-medium text-success"
          : "flex items-center gap-2 rounded-control border border-brand-200 bg-primary-subtle px-4 py-3 text-sm font-medium text-brand-950"
      }
      role="status"
    >
      {live ? (
        <Wifi aria-hidden="true" className="h-4 w-4" />
      ) : (
        <Eye aria-hidden="true" className="h-4 w-4" />
      )}
      {live
        ? "Connected to the MIZAN API with your Firebase session."
        : "Interface preview uses the stable synthetic Berrechid demo data."}
    </div>
  );
}
