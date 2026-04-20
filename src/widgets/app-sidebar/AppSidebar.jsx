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
  { label: "Workflows", mobileLabel: "Flows", icon: GitBranch, to: "/workflows" },
  { label: "AI", icon: Sparkles },
  { label: "Notes", icon: FileText },
  { label: "Settings", icon: Settings },
];

const secondaryItems = [
  { label: "Help", icon: CircleHelp },
  { label: "Log Out", icon: LogOut },
];

function DesktopNavItem({ icon: Icon, label, to }) {
  const className = ({ isActive } = {}) =>
    cn(
      "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-[15px] font-medium transition-colors",
      isActive
        ? "bg-step-trigger text-white shadow-sm"
        : "text-sidebar-foreground hover:bg-white/70 hover:text-sidebar-accent-foreground",
      !to && "cursor-default",
    );

  const content = (
    <>
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </>
  );

  if (to) {
    return (
      <NavLink to={to} className={className}>
        {content}
      </NavLink>
    );
  }

  return (
    <button type="button" className={className()}>
      {content}
    </button>
  );
}

function MobileNavItem({ icon: Icon, label, mobileLabel, to }) {
  const className = ({ isActive } = {}) =>
    cn(
      "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-[20px] px-2 py-2 text-center text-[11px] font-medium leading-tight transition-colors",
      isActive
        ? "bg-white text-step-trigger shadow-[0_8px_20px_rgba(15,23,42,0.08)]"
        : "text-sidebar-foreground/85 hover:bg-white/70 hover:text-sidebar-accent-foreground",
      !to && "cursor-default",
    );

  const content = (
    <>
      <Icon className="h-5 w-5 shrink-0" />
      <span className="block max-w-full truncate">{mobileLabel ?? label}</span>
    </>
  );

  if (to) {
    return (
      <NavLink to={to} className={className}>
        {content}
      </NavLink>
    );
  }

  return (
    <button type="button" className={className()}>
      {content}
    </button>
  );
}

function SidebarActionButton({ icon: Icon, label, active = false }) {
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
    <>
      <aside className="fixed inset-x-0 bottom-0 z-40 border-t border-[#d7e0e5] bg-[#f7f8fa]/95 backdrop-blur md:hidden">
        <nav
          aria-label="Mobile navigation"
          className="mx-auto grid max-w-5xl grid-cols-6 gap-1 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-2"
        >
          {primaryItems.map((item) => (
            <MobileNavItem
              key={item.label}
              icon={item.icon}
              label={item.label}
              mobileLabel={item.mobileLabel}
              to={item.to}
            />
          ))}
        </nav>
      </aside>

      <aside className="hidden w-72 shrink-0 border-r border-[#d7e0e5] bg-[#eef2f4] md:flex md:min-h-screen md:flex-col">
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
          <nav className="space-y-2" aria-label="Sidebar navigation">
            {primaryItems.map((item) => (
              <DesktopNavItem
                key={item.label}
                icon={item.icon}
                label={item.label}
                to={item.to}
              />
            ))}
          </nav>

          <div className="mt-auto rounded-[20px] bg-[#dde4ea] p-3">
            {secondaryItems.map((item) => (
              <SidebarActionButton key={item.label} icon={item.icon} label={item.label} />
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}
