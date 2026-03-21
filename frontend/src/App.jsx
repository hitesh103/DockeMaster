import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './context/AuthContext';
import ProtectedLayout from './components/layout/ProtectedLayout';
import LoginPage from './pages/Login';
import ContainersPage from './pages/ContainersPage';
import ContainerDetailPage from './pages/ContainerDetailPage';
import ImagesPage from './pages/ImagesPage';
import DeployPage from './pages/DeployPage';

export default function App() {
  return (
    <AuthProvider>
      <Toaster richColors />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedLayout />}>
            <Route index element={<div className="p-6 text-muted-foreground">Dashboard coming soon</div>} />
            <Route path="/containers" element={<ContainersPage />} />
            <Route path="/containers/:id" element={<ContainerDetailPage />} />
            <Route path="/images" element={<ImagesPage />} />
            <Route path="/deploy" element={<DeployPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
