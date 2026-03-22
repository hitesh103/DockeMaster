import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';
import ProtectedLayout from './components/layout/ProtectedLayout';
import LoginPage from './pages/Login';
import DashboardHome from './pages/DashboardHome';
import ContainersPage from './pages/ContainersPage';
import ContainerDetailPage from './pages/ContainerDetailPage';
import ImagesPage from './pages/ImagesPage';
import DeployPage from './pages/DeployPage';
import LogsPage from './pages/LogsPage';
import TerminalPage from './pages/TerminalPage';
import MetricsPage from './pages/MetricsPage';
import ServicesPage from './pages/ServicesPage';
import StacksPage from './pages/StacksPage';
import VolumesPage from './pages/VolumesPage';
import NetworksPage from './pages/NetworksPage';
import RegistriesPage from './pages/RegistriesPage';
import NodesPage from './pages/NodesPage';
import UsersPage from './pages/UsersPage';
import AuditLogsPage from './pages/AuditLogsPage';
import AlertsSettingsPage from './pages/AlertsSettingsPage';

// Admin-only route guard
function AdminRoute({ children }) {
  const { user } = useAuth();
  if (!user) return null;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster richColors />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedLayout />}>
            <Route index element={<DashboardHome />} />
            <Route path="/containers" element={<ContainersPage />} />
            <Route path="/containers/:id" element={<ContainerDetailPage />} />
            <Route path="/images" element={<ImagesPage />} />
            <Route path="/deploy" element={<DeployPage />} />
            <Route path="/logs/:id" element={<LogsPage />} />
            <Route path="/terminal/:id" element={<TerminalPage />} />
            <Route path="/metrics/:id" element={<MetricsPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/stacks" element={<StacksPage />} />
            <Route path="/volumes" element={<VolumesPage />} />
            <Route path="/networks" element={<NetworksPage />} />
            <Route path="/registries" element={<RegistriesPage />} />
            <Route path="/nodes" element={<NodesPage />} />
            <Route path="/audit-logs" element={<AuditLogsPage />} />
            <Route path="/alerts" element={<AlertsSettingsPage />} />
            <Route
              path="/users"
              element={
                <AdminRoute>
                  <UsersPage />
                </AdminRoute>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
