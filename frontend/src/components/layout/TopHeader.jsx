import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Button } from '../ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../ui/sheet';
import { useAuth } from '../../context/AuthContext';
import SidebarNav from './SidebarNav';

function derivePageTitle(pathname) {
  if (pathname === '/') return 'Dashboard';
  const segment = pathname.split('/').filter(Boolean)[0] || '';
  return segment
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export default function TopHeader() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const auth = useAuth();

  const title = derivePageTitle(location.pathname);

  function handleLogout() {
    auth.logout();
    navigate('/login');
  }

  return (
    <header className="h-14 border-b border-border bg-background px-4 flex items-center justify-between shrink-0">
      {/* Mobile hamburger */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <span className="font-medium text-foreground">{title}</span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {auth?.user?.username && (
          <span className="text-sm text-muted-foreground hidden sm:block">
            {auth.user.username}
          </span>
        )}
        <Button variant="outline" size="sm" onClick={handleLogout}>
          Logout
        </Button>
      </div>

      {/* Mobile nav sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-60 p-0">
          <SheetHeader className="h-14 flex justify-center border-b border-border px-4">
            <SheetTitle>DockMaster</SheetTitle>
          </SheetHeader>
          <nav className="px-2 py-3" onClick={() => setOpen(false)}>
            <SidebarNav />
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  );
}
