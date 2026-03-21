import { useAuth } from '../../context/AuthContext';
import SidebarNav from './SidebarNav';

export default function Sidebar() {
  const auth = useAuth();
  const username = auth?.user?.username;

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col h-screen bg-background border-r border-border">
      <div className="flex h-14 items-center border-b border-border px-4">
        <span className="font-semibold text-foreground">DockMaster</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <SidebarNav />
      </nav>

      {username && (
        <div className="border-t border-border px-4 py-3">
          <span className="text-xs text-muted-foreground truncate block">{username}</span>
        </div>
      )}
    </aside>
  );
}
