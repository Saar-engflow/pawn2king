import { Sidebar } from "@/components/ui/modern-side-bar";

export default function SettingsPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold tracking-tight">Settings</h1>
        <p className="mt-4 text-xl text-muted-foreground">Coming soon</p>
      </main>
    </div>
  );
}
