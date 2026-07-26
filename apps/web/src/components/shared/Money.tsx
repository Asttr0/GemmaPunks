import { formatMAD } from "../../lib/format";

export function Money({
  centimes,
  className,
}: {
  centimes: number;
  className?: string;
}) {
  return (
    <span className={`tabular-nums ${className ?? ""}`}>
      {formatMAD(centimes)}
    </span>
  );
}
