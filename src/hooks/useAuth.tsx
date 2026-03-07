import { useState, useEffect, createContext, useContext } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

// ВРЕМЕННО: используем any для Profile
type Profile = any;

type AuthContext = {
  user: User | null;
  session: Session | null;
  profile: Profile;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthCtx = createContext<AuthContext>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  signOut: async () => { },
});

const fetchProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")  // ВРЕМЕННО: выбираем все поля
    .eq("user_id", userId)
    .single();
  
  if (error) {
    console.log("Error fetching profile:", error);
    return { nickname: 'Player', is_pro: false, role: 'user' };
  }
  
  console.log("Profile data from Supabase:", data); // ← посмотрим, что приходит
  return data;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(async () => {
          const data = await fetchProfile(session.user.id);
          setProfile(data);
        }, 0);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).then(data => {
          console.log("Setting profile:", data);
          setProfile(data);
        });
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthCtx.Provider value={{ user, session, profile, loading, signOut }}>
      {children}
    </AuthCtx.Provider>
  );
};

export const useAuth = () => useContext(AuthCtx);