import { useEffect, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";

export function useUserRole() {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getUserRole() {
      try {
        // 1. Получаем текущего пользователя
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setRole(null);
          return;
        }

        // 2. Получаем его роль из таблицы profiles
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        
        setRole(data?.role || 'user');
      } catch (error) {
        console.error('Error fetching user role:', error);
        setRole(null);
      } finally {
        setLoading(false);
      }
    }

    getUserRole();
  }, []);

  return { role, loading, isAdmin: role === 'admin' };
}