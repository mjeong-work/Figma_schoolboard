import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { localAuthRepository, type AuthUserRecord, type UserStatus } from './authRepository';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  verified: boolean;
  status: UserStatus;
  avatar?: string;
  graduationYear?: string;
}

export interface CurrentUser extends User {
  displayName: string;
}

interface AuthContextType {
  user: User | null;
  currentUser: CurrentUser | null;
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
const CURRENT_USER_KEY = 'campusconnect_currentUser';

const toPublicUser = (record: AuthUserRecord): User => ({
  id: record.id,
  name: record.name,
  email: record.email,
  role: record.role,
  department: record.department,
  verified: record.verified,
  status: record.status,
  avatar: record.avatar,
  graduationYear: record.graduationYear,
});

const safeReadCurrentUser = (): User | null => {
  const raw = localStorage.getItem(CURRENT_USER_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as User;
    const dbUser = localAuthRepository.findById(parsed.id);
    return dbUser ? toPublicUser(dbUser) : null;
  } catch {
    return null;
  }
};

const saveCurrentUser = (user: User | null) => {
  if (!user) {
    localStorage.removeItem(CURRENT_USER_KEY);
    return;
  }
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUser(safeReadCurrentUser());
  }, []);

  const currentUser = useMemo<CurrentUser | null>(() => {
    if (!user) return null;
    return {
      ...user,
      displayName: user.name,
    };
  }, [user]);

  const login = async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const foundUser = localAuthRepository.findByEmail(email);
    if (!foundUser) {
      return { success: false, message: 'No account found with that email.' };
    }

    if (foundUser.password !== password) {
      return { success: false, message: 'Incorrect password.' };
    }

    const authenticatedUser = toPublicUser(foundUser);
    setUser(authenticatedUser);
    saveCurrentUser(authenticatedUser);

    if (authenticatedUser.status === 'pending') {
      return {
        success: true,
        message: 'Login successful. Your account is still pending approval.',
      };
    }

    if (authenticatedUser.status === 'rejected') {
      return {
        success: true,
        message: 'Login successful. Your account has been rejected.',
      };
    }

    return { success: true, message: 'Login successful.' };
  };

  const register = async (data: RegisterData): Promise<{ success: boolean; message: string }> => {
    await new Promise((resolve) => setTimeout(resolve, 300));

    if (!data.email.endsWith('.edu')) {
      return { success: false, message: 'Please use a valid campus email address (.edu).' };
    }

    if (localAuthRepository.findByEmail(data.email)) {
      return { success: false, message: 'An account with this email already exists.' };
    }

    const newUserRecord: AuthUserRecord = {
      id: Date.now().toString(),
      name: data.name,
      email: data.email.trim().toLowerCase(),
      password: data.password,
      role: data.role,
      department: data.department,
      graduationYear: data.graduationYear,
      verified: false,
      status: 'pending',
      createdAt: Date.now(),
    };

    localAuthRepository.createUser(newUserRecord);

    const newUser = toPublicUser(newUserRecord);
    setUser(newUser);
    saveCurrentUser(newUser);

    return {
      success: true,
      message: 'Registration successful. Your account is pending admin approval.',
    };
  };

  const logout = () => {
    setUser(null);
    saveCurrentUser(null);
  };

  const updateUser = (updates: Partial<User>) => {
    if (!user) return;

    const updatedDbUser = localAuthRepository.updateUser(user.id, {
      name: updates.name,
      role: updates.role,
      department: updates.department,
      verified: updates.verified,
      status: updates.status,
      avatar: updates.avatar,
      graduationYear: updates.graduationYear,
    });

    if (!updatedDbUser) return;

    const updatedUser = toPublicUser(updatedDbUser);
    setUser(updatedUser);
    saveCurrentUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        currentUser,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateUser,
      }}
    >
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

export const getPendingUsers = (): User[] => {
  return localAuthRepository
    .getAllUsers()
    .filter((user) => user.status === 'pending')
    .map(toPublicUser);
};

export const approveUser = (userId: string) => {
  const updated = localAuthRepository.updateUser(userId, {
    status: 'approved',
    verified: true,
  });

  if (!updated) return;

  const sessionUser = safeReadCurrentUser();
  if (sessionUser?.id === userId) {
    saveCurrentUser(toPublicUser(updated));
  }
};

export const rejectUser = (userId: string) => {
  const updated = localAuthRepository.updateUser(userId, {
    status: 'rejected',
  });

  if (!updated) return;

  const sessionUser = safeReadCurrentUser();
  if (sessionUser?.id === userId) {
    saveCurrentUser(toPublicUser(updated));
  }
};
