import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  verified: boolean;
  status: 'pending' | 'approved' | 'rejected';
  avatar?: string;
  graduationYear?: string;
  bio?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: string;
  department: string;
  graduationYear?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  // Load user on mount
  useEffect(() => {
    // Get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) fetchProfile(session.user.id);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchProfile(session.user.id);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (data) {
      setUser({
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
        department: data.department,
        verified: data.verified,
        status: data.status,
        avatar: data.avatar_url,
        graduationYear: data.graduation_year,
        bio: data.bio,
      });
    }
  };

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, message: error.message };
    return { success: true, message: 'Login successful' };
  };

  const register = async (data: RegisterData) => {
    // Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });

    if (authError) return { success: false, message: authError.message };
    if (!authData.user) return { success: false, message: 'Registration failed' };

    // Create profile in profiles table
    const { error: profileError } = await supabase.from('profiles').insert({
      id: authData.user.id,
      name: data.name,
      email: data.email,
      role: data.role,
      department: data.department,
      graduation_year: data.graduationYear,
      status: 'pending',
      verified: false,
    });

    if (profileError) return { success: false, message: profileError.message };
    return { success: true, message: 'Registration successful! Your account is pending approval.' };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return;

    const { error } = await supabase.from('profiles').update({
      name: updates.name,
      role: updates.role,
      department: updates.department,
      graduation_year: updates.graduationYear,
      bio: updates.bio,
      avatar_url: updates.avatar,
    }).eq('id', user.id);

    if (!error) {
      setUser({ ...user, ...updates });
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};


// Helper functions for admin to manage users
export const approveUser = async (userId: string) => {
  const { error } = await supabase
    .from('profiles')
    .update({ status: 'approved', verified: true })
    .eq('id', userId);
  return { error };
};

export const rejectUser = async (userId: string) => {
  const { error } = await supabase
    .from('profiles')
    .update({ status: 'rejected' })
    .eq('id', userId);
  return { error };
};

export const getPendingUsers = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('status', 'pending');
  return data || [];
};