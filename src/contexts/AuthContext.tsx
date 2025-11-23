import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('askify_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const register = async (email: string, password: string, name: string): Promise<boolean> => {
    const users = JSON.parse(localStorage.getItem('askify_users') || '{}');
    
    if (users[email]) {
      return false; // User already exists
    }

    users[email] = { password, name };
    localStorage.setItem('askify_users', JSON.stringify(users));
    
    const newUser = { email, name };
    setUser(newUser);
    localStorage.setItem('askify_user', JSON.stringify(newUser));
    return true;
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    const users = JSON.parse(localStorage.getItem('askify_users') || '{}');
    
    if (!users[email] || users[email].password !== password) {
      return false;
    }

    const loggedInUser = { email, name: users[email].name };
    setUser(loggedInUser);
    localStorage.setItem('askify_user', JSON.stringify(loggedInUser));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('askify_user');
  };

  const updateUser = (updates: Partial<User>) => {
    if (!user) return;
    
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem('askify_user', JSON.stringify(updatedUser));
    
    // Update in users list
    const users = JSON.parse(localStorage.getItem('askify_users') || '{}');
    if (users[user.email]) {
      users[user.email].name = updatedUser.name;
      localStorage.setItem('askify_users', JSON.stringify(users));
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
