import { Sidebar } from "../../components/ui/modern-side-bar";
import { AddictionTracker } from "../../components/ui/addiction-tracker";
import { Toaster } from "../../components/ui/toaster";

export default function AddictionPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <AddictionTracker />
      </main>
      <Toaster />
    </div>
  );
}
