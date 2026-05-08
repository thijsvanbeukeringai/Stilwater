import { Sidebar } from "./_components/Sidebar"
import { TopBar } from "./_components/TopBar"
import { Toaster } from "@/components/accreditation/Toast"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-zinc-50">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
      <Toaster />
    </div>
  )
}
