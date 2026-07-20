import { Sidebar } from "./_components/sidebar";

export default function AppV1Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-hidden bg-surface-container-lowest">
        {children}
      </main>
    </div>
  );
}
