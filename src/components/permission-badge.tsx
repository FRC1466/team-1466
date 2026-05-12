import { Badge } from "@/components/ui/badge";
import { PERMISSION_COLOR, PERMISSION_LABEL, type PermissionLevel } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function PermissionBadge({
  level,
  className,
}: {
  level: PermissionLevel;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn("font-medium", PERMISSION_COLOR[level], className)}
    >
      {PERMISSION_LABEL[level]}
    </Badge>
  );
}
