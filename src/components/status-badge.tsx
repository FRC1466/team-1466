import { Badge } from "@/components/ui/badge";
import { MEMBER_STATUS_LABEL, type MemberStatus } from "@/lib/constants";

const COLOR: Record<MemberStatus, string> = {
  active: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  inactive: "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/30",
  pending: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  alumni: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
};

export function StatusBadge({ status }: { status: MemberStatus }) {
  return (
    <Badge variant="outline" className={`text-xs ${COLOR[status]}`}>
      {MEMBER_STATUS_LABEL[status]}
    </Badge>
  );
}
