import {
  Activity,
  CircleHelp,
  Cpu,
  FileText,
  GitBranch,
  LogOut,
  Settings,
  Sparkles,
  Triangle,
} from "lucide-react";
import { NavLink } from "react-router-dom";

import { cn } from "@/lib/utils.js";

const primaryItems = [
  { label: "Climate", icon: Activity },
  { label: "Equipment", icon: Cpu },
  { label: "AI", icon: Sparkles },
  { label: "Notes", icon: FileText },
  { label: "Settings", icon: Settings },
];

const secondaryItems = [
  { label: "Help", icon: CircleHelp },
  { label: "Log Out", icon: LogOut },
];

function SidebarNavButton({ icon: Icon, label, active = false }) {
  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-[15px] font-medium transition-colors",
        active
          ? "bg-step-trigger text-white shadow-sm"
          : "cursor-default text-sidebar-foreground hover:bg-white/70 hover:text-sidebar-accent-foreground",
      )}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </button>
  );
}

export function AppSidebar() {
  return (
    <aside className="w-full shrink-0 border-b border-[#d7e0e5] bg-[#eef2f4] md:flex md:min-h-screen md:w-72 md:flex-col md:border-b-0 md:border-r">
      <div className="px-6 pb-6 pt-8">
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-step-trigger shadow-sm">
            <Triangle className="h-4 w-4 fill-current" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-semibold tracking-tight text-step-trigger md:text-2xl">
              GROWDIRECTOR
            </span>
            <span className="h-2 w-2 rounded-full bg-step-trigger" />
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-6 px-3 pb-4">
        <nav className="space-y-2">
          {primaryItems.slice(0, 2).map((item) => (
            <SidebarNavButton key={item.label} icon={item.icon} label={item.label} />
          ))}

          <NavLink
            to="/workflows"
            className={({ isActive }) =>
              cn(
                "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-[15px] font-medium transition-colors",
                isActive
                  ? "bg-step-trigger text-white shadow-sm"
                  : "text-sidebar-foreground hover:bg-white/70 hover:text-sidebar-accent-foreground",
              )
            }
          >
            <GitBranch className="h-5 w-5" />
            <span>Workflows</span>
          </NavLink>

          {primaryItems.slice(2).map((item) => (
            <SidebarNavButton key={item.label} icon={item.icon} label={item.label} />
          ))}
        </nav>

        <div className="mt-auto rounded-[20px] bg-[#dde4ea] p-3">
          {secondaryItems.map((item) => (
            <SidebarNavButton key={item.label} icon={item.icon} label={item.label} />
          ))}
        </div>
      </div>
    </aside>
  );
}
