import { Sidebar } from "@/components/ui/modern-side-bar";
import { TodoCard } from "@/components/ui/to-do-card";
import { Toaster } from "@/components/ui/toaster";

export default function RoutinePage() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <TodoCard />
      </main>
      <Toaster />
    </div>
  );
}
