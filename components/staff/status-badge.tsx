import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "ACTIVE" | "INACTIVE";
  className?: string;
}

const statusLabels = {
  ACTIVE: "在職",
  INACTIVE: "離職",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge
      variant={status === "ACTIVE" ? "default" : "secondary"}
      className={cn(
        status === "ACTIVE"
          ? "bg-green-600 hover:bg-green-700 text-white"
          : "bg-gray-400 hover:bg-gray-500 text-white",
        className
      )}
    >
      {statusLabels[status]}
    </Badge>
  );
}
