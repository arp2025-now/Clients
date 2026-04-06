export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: "#f0f2f5" }}>
      <header className="bg-white border-b border-gray-200 px-6 py-3.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl ap-gradient flex items-center justify-center text-white font-black text-xs">
            AP
          </div>
          <div>
            <p className="font-black text-sm text-gray-900">
              AP<span className="text-[#1CA9C9]">.</span>Automations
            </p>
            <p className="text-[10px] text-gray-400 font-medium">Admin Panel</p>
          </div>
        </div>
        <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-3 py-1 rounded-full">פנימי בלבד</span>
      </header>
      <main>{children}</main>
    </div>
  );
}
