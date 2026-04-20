import { Outlet } from "react-router-dom";

import { AppSidebar } from "@/widgets/app-sidebar/AppSidebar.jsx";

export function AppLayout() {
  return (
    <div className="min-h-screen bg-[#f7f8fa] md:flex">
      <AppSidebar />
      <main className="min-w-0 flex-1 bg-white">
        <Outlet />
      </main>
    </div>
  );
}
