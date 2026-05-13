import type { ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { useTheme } from "next-themes";
import {
  BarChart3,
  Blocks,
  Home,
  KeyRound,
  LogOut,
  Menu,
  Moon,
  NotebookPen,
  Settings,
  Shield,
  StickyNote,
  Sun,
  Users,
  UsersRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useUI } from "@/lib/ui-store";
import { api } from "../../convex/_generated/api";
import { cn } from "@/lib/utils";
import { PERMISSION_LABEL } from "@/lib/constants";

const navItems = [
  { to: "/", label: "Dashboard", icon: Home, end: true },
  { to: "/people", label: "People", icon: Users },
  { to: "/subteams", label: "Subteams", icon: UsersRound },
  { to: "/roles", label: "Roles", icon: Shield },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/notes", label: "Notes", icon: StickyNote },
  { to: "/access", label: "Access", icon: KeyRound },
  { to: "/apps", label: "Apps", icon: Blocks },
  { to: "/settings", label: "Settings", icon: Settings },
];

// WebbPower URL — set VITE_WEBBPOWER_URL in the Vercel/env config.
// Falls back to the FRC1466 Vercel deployment if not configured.
export const WEBBPOWER_URL =
  (import.meta as unknown as { env: Record<string, string> }).env
    .VITE_WEBBPOWER_URL ?? "https://webbpower.vercel.app";

function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const isDark = (theme === "system" ? resolvedTheme : theme) === "dark";
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition",
              "hover:bg-accent hover:text-accent-foreground",
              isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground",
            )
          }
        >
          <item.icon className="size-4" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}

function TopNavInline() {
  return (
    <nav className="hidden lg:flex items-center gap-1">
      {navItems.slice(0, 6).map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition",
              "hover:bg-accent hover:text-accent-foreground",
              isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground",
            )
          }
        >
          <item.icon className="size-4" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}

function UserMenu() {
  const { signOut } = useAuthActions();
  const me = useQuery(api.members.me);
  const member = me?.member;
  const initials = member?.name
    ? member.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" className="h-9 gap-2 px-2">
            <Avatar className="size-7">
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <span className="hidden md:inline text-sm font-medium truncate max-w-[120px]">
              {member?.name ?? "Account"}
            </span>
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">{member?.name ?? ""}</span>
          <span className="text-xs text-muted-foreground">
            {member?.permission ? PERMISSION_LABEL[member.permission] : ""}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link to="/settings" />}>
          <Settings className="size-4 mr-2" /> Settings
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link to="/notes" />}>
          <NotebookPen className="size-4 mr-2" /> Notes
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut()}>
          <LogOut className="size-4 mr-2" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  const mobileOpen = useUI((s) => s.mobileNavOpen);
  const setMobileOpen = useUI((s) => s.setMobileNavOpen);
  const workspace = useQuery(api.workspace.get);
  const location = useLocation();
  const currentLabel = navItems.find((n) =>
    n.end ? location.pathname === n.to : location.pathname.startsWith(n.to) && n.to !== "/",
  )?.label ?? "Dashboard";

  return (
    <div className="min-h-svh flex flex-col bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pt-[env(safe-area-inset-top)]">
        <div className="mx-auto max-w-7xl flex items-center gap-2 px-4 h-14">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                  <Menu className="size-5" />
                </Button>
              }
            />
            <SheetContent side="left" className="w-72 p-0">
              <SheetHeader className="px-4 py-3 border-b">
                <SheetTitle className="text-left">{workspace?.name ?? "Team"}</SheetTitle>
              </SheetHeader>
              <div className="p-3">
                <NavList onNavigate={() => setMobileOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>

          <Link to="/" className="font-semibold tracking-tight text-base whitespace-nowrap">
            {workspace?.name ?? "Team"}
          </Link>
          <span className="text-muted-foreground text-sm lg:hidden ml-2 whitespace-nowrap">/ {currentLabel}</span>

          <div className="flex-1" />

          <TopNavInline />

          <div className="flex items-center gap-1">
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto max-w-7xl w-full px-4 py-6">{children}</main>
    </div>
  );
}
