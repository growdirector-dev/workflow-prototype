import { Outlet } from "react-router-dom";

import { AppSidebar } from "@/widgets/app-sidebar/AppSidebar.jsx";

export function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-[#f7f8fa] md:flex-row">
      <AppSidebar />
      <main className="min-w-0 flex-1 bg-white pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-0">
        <Outlet />
      </main>
    </div>
  );
}
