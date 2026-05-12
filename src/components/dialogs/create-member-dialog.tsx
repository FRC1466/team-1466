import { useQuery } from "convex/react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MemberForm } from "@/components/member-form";
import { useUI } from "@/lib/ui-store";
import { api } from "../../../convex/_generated/api";
import { isManager, type PermissionLevel } from "@/lib/constants";

export function CreateMemberDialog() {
  const dialog = useUI((s) => s.dialog);
  const close = useUI((s) => s.closeDialog);
  const me = useQuery(api.members.me);
  const meIsManager = isManager(me?.member?.permission as PermissionLevel | undefined);

  return (
    <Dialog open={dialog === "create-member"} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add member</DialogTitle>
          <DialogDescription>
            Create a member profile. Login access defaults to pending until the person signs up.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
          <MemberForm meIsManager={meIsManager} onDone={close} />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
