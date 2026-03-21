import { Navigate } from 'react-router-dom';
import AppShell from './AppShell';

function decodeToken(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

export default function ProtectedLayout() {
  const token = localStorage.getItem('dockmaster_token');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp || decoded.exp * 1000 < Date.now()) {
    return <Navigate to="/login" replace />;
  }

  return <AppShell />;
}
