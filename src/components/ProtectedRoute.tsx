import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useUserRole } from '../hooks/useUserRole';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'admin' | 'user'; // какие роли пускаем
}

export function ProtectedRoute({ 
  children, 
  requiredRole = 'user' 
}: ProtectedRouteProps) {
  const { role, loading, isAdmin } = useUserRole();

  // Пока грузится - показываем ничего или лоадер
  if (loading) {
    return <div>Загрузка...</div>; // или красивый спиннер
  }

  // Если пользователь не залогинен - кидаем на логин
  if (!role) {
    return <Navigate to="/login" replace />;
  }

  // Если требуется админка, а пользователь не админ
  if (requiredRole === 'admin' && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  // Все проверки пройдены - показываем страницу
  return <>{children}</>;
}