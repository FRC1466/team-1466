import { create } from "zustand";
import type { Id } from "../../convex/_generated/dataModel";

type DialogKey =
  | "create-member"
  | "edit-member"
  | "create-subteam"
  | "create-skill"
  | "create-note"
  | "rename-workspace"
  | null;

type Pane = "dashboard" | "people" | "subteams" | "roles" | "analytics" | "access" | "settings";

type UIState = {
  mobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;

  dialog: DialogKey;
  dialogPayload: unknown;
  openDialog: (key: Exclude<DialogKey, null>, payload?: unknown) => void;
  closeDialog: () => void;

  selectedMemberId: Id<"members"> | null;
  setSelectedMemberId: (id: Id<"members"> | null) => void;

  peopleSearch: string;
  setPeopleSearch: (s: string) => void;

  peopleFilterSubteam: Id<"subteams"> | "all";
  setPeopleFilterSubteam: (v: Id<"subteams"> | "all") => void;

  peopleFilterPermission: string;
  setPeopleFilterPermission: (v: string) => void;

  activePane: Pane;
  setActivePane: (p: Pane) => void;
};

export const useUI = create<UIState>((set) => ({
  mobileNavOpen: false,
  setMobileNavOpen: (open) => set({ mobileNavOpen: open }),

  dialog: null,
  dialogPayload: null,
  openDialog: (key, payload) => set({ dialog: key, dialogPayload: payload }),
  closeDialog: () => set({ dialog: null, dialogPayload: null }),

  selectedMemberId: null,
  setSelectedMemberId: (id) => set({ selectedMemberId: id }),

  peopleSearch: "",
  setPeopleSearch: (s) => set({ peopleSearch: s }),

  peopleFilterSubteam: "all",
  setPeopleFilterSubteam: (v) => set({ peopleFilterSubteam: v }),

  peopleFilterPermission: "all",
  setPeopleFilterPermission: (v) => set({ peopleFilterPermission: v }),

  activePane: "dashboard",
  setActivePane: (p) => set({ activePane: p }),
}));
