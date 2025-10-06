import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI, LoginData, SignupData } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface User {
  user_id: string;
  name: string;
  token: string;
}

interface AuthContextType {
  user: User | null;
  login: (data: LoginData) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user_id = localStorage.getItem('user_id');
    const name = localStorage.getItem('name');
    if (token && user_id) {
      setUser({ user_id, name: name || '', token });
    }
  }, []);

  const login = async (data: LoginData) => {
    try {
      const response = await authAPI.login(data);
      const { token } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user_id', data.user_id);
      setUser({ user_id: data.user_id, name: '', token });
      toast({
        title: "Login Successful",
        description: `Welcome back, ${data.user_id}!`,
      });
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.response?.data?.error || "Invalid credentials",
        variant: "destructive",
      });
      throw error;
    }
  };

  const signup = async (data: SignupData) => {
    console.log('🔵 Attempting signup with data:', { user_id: data.user_id, name: data.name });
    try {
      console.log('🔵 Calling authAPI.signup...');
      const response = await authAPI.signup(data);
      console.log('✅ Signup response:', response.data);
      
      const { token } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user_id', data.user_id);
      localStorage.setItem('name', data.name);
      setUser({ user_id: data.user_id, name: data.name, token });
      toast({
        title: "Signup Successful",
        description: `Welcome, ${data.name}!`,
      });
    } catch (error: any) {
      console.error('❌ Signup error:', error);
      console.error('❌ Error response:', error.response);
      console.error('❌ Error message:', error.message);
      
      let errorMessage = "Could not create account";
      
      if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
        errorMessage = `Cannot connect to backend at ${import.meta.env.VITE_BASE_URL || 'http://127.0.0.1:5000'}. Is your Flask server running?`;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      toast({
        title: "Signup Failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('name');
    setUser(null);
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully.",
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
