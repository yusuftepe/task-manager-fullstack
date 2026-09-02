import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { isTokenValid } from '../utils/auth';

function ProtectedRoute({ children }: { children: ReactNode }) {
    const token = localStorage.getItem('token');

    if (!isTokenValid(token)) {
        if (token) {
            localStorage.removeItem('token');
        }
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
}

export default ProtectedRoute;
