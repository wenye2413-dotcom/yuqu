// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // 从 auth.user_metadata 读取用户资料
  // 也同步从 profiles 表读取
  const fetchProfile = useCallback(async (userId) => {
    console.log('[AuthContext] fetchProfile userId:', userId);
    const { data: { user: freshUser } } = await supabase.auth.getUser();
    console.log('[AuthContext] freshUser from getUser:', freshUser?.id, freshUser?.email);
    // 优先从 auth.user_metadata 读取
    if (freshUser?.user_metadata) {
      setProfile({
        id: freshUser.id,
        name: freshUser.user_metadata.name || '',
        avatar_url: freshUser.user_metadata.avatar_url || '',
        gender: freshUser.user_metadata.gender || '',
        birthday: freshUser.user_metadata.birthday || '',
        location: freshUser.user_metadata.location || '',
        bio: freshUser.user_metadata.bio || '',
      });
    } else {
      setProfile(null);
    }

    // 再从 profiles 表读取并合并（补充数据）
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (profileData) {
        setProfile(prev => ({
          ...prev,
          id: userId,
          name: profileData.name || prev?.name || '',
          avatar_url: profileData.avatar_url || prev?.avatar_url || '',
          gender: profileData.gender || prev?.gender || '',
          birthday: profileData.birthday || prev?.birthday || '',
          location: profileData.location || prev?.location || '',
          bio: profileData.bio || prev?.bio || '',
        }));
      }
    } catch (err) {
      // profiles 表可能还不存在，忽略
      console.log('[AuthContext] profiles table not ready yet:', err.message);
    }
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('[AuthContext] getSession result:', session?.user?.email, !!session);
      const u = session?.user ?? null;
      setUser(u);
      if (u) fetchProfile(u.id);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[AuthContext] onAuthStateChange event:', event, 'user:', session?.user?.email);
      const u = session?.user ?? null;
      setUser(u);
      if (u) fetchProfile(u.id);
      setLoading(false);
    });

    return () => listener?.subscription.unsubscribe();
  }, [fetchProfile]);

  if (loading) {
    return null;
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, isLoggedIn: !!user, logout, refreshProfile: () => user && fetchProfile(user.id) }}>
      {children}
    </AuthContext.Provider>
  );
};

