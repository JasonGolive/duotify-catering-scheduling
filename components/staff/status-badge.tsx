import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "ACTIVE" | "INACTIVE";
  className?: string;
}

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
      {status}
    </Badge>
  );
}
