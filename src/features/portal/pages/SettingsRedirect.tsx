import { Navigate } from 'react-router-dom';
import { usePortal } from '../../../core/context/portalContext';

/** The old Settings address. What was there is now under Institution profile, Campuses, Curriculum and Staff policies. */
export default function SettingsRedirect() {
  const { path } = usePortal();
  return <Navigate to={path('institution')} replace />;
}
