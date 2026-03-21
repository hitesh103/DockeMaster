import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Box,
  Image,
  Layers,
  Network,
  Database,
  Rocket,
  FileText,
  Terminal,
  BarChart2,
  Server,
  HardDrive,
  Globe,
  Users,
  ClipboardList,
  Bell,
} from 'lucide-react';
import { Separator } from '../ui/separator';

const navItems = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard, end: true },
  { label: 'Containers', to: '/containers', icon: Box },
  { label: 'Images', to: '/images', icon: Image },
  { label: 'Stacks', to: '/stacks', icon: Layers },
  { label: 'Services', to: '/services', icon: Network },
  { label: 'Registries', to: '/registries', icon: Database },
  { label: 'Deploy', to: '/deploy', icon: Rocket },
  'separator',
  { label: 'Logs', to: '/logs', icon: FileText },
  { label: 'Terminal', to: '/terminal', icon: Terminal },
  { label: 'Metrics', to: '/metrics', icon: BarChart2 },
  'separator',
  { label: 'Nodes', to: '/nodes', icon: Server },
  { label: 'Volumes', to: '/volumes', icon: HardDrive },
  { label: 'Networks', to: '/networks', icon: Globe },
  'separator',
  { label: 'Users', to: '/users', icon: Users },
  { label: 'Audit Logs', to: '/audit-logs', icon: ClipboardList },
  { label: 'Alerts', to: '/alerts', icon: Bell },
];

export { navItems };

export default function SidebarNav() {
  return (
    <div className="space-y-0.5">
      {navItems.map((item, i) =>
        item === 'separator' ? (
          <Separator key={`sep-${i}`} className="my-2" />
        ) : (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
              }`
            }
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </NavLink>
        )
      )}
    </div>
  );
}
