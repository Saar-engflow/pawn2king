import { Sidebar } from "@/components/ui/modern-side-bar";
import { OverviewDashboard } from "@/components/ui/overview-dashboard";

export default function DashboardPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <OverviewDashboard />
      </main>
    </div>
  );
}
