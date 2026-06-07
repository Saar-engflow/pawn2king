import { Sidebar } from "../../components/ui/modern-side-bar";
import { GoalsManager } from "../../components/ui/goals-manager";
import { Toaster } from "../../components/ui/toaster";

export default function GoalsPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#0A0F1F]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <GoalsManager />
      </main>
      <Toaster />
    </div>
  );
}
