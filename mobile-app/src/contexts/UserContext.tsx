import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useUser } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';

type UserRole = 'student' | 'teacher' | null;

interface UserContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const ROLE_STORAGE_KEY = 'user_role';

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [role, setRoleState] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useUser();

  // Load role from storage on mount
  useEffect(() => {
    loadRole();
  }, []);

  // Clear role when user logs out
  useEffect(() => {
    if (!user) {
      setRoleState(null);
      SecureStore.deleteItemAsync(ROLE_STORAGE_KEY);
    }
  }, [user]);

  const loadRole = async () => {
    try {
      const storedRole = await SecureStore.getItemAsync(ROLE_STORAGE_KEY);
      if (storedRole === 'student' || storedRole === 'teacher') {
        setRoleState(storedRole);
      }
    } catch (error) {
      console.error('Error loading role:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setRole = async (newRole: UserRole) => {
    setRoleState(newRole);
    if (newRole) {
      try {
        await SecureStore.setItemAsync(ROLE_STORAGE_KEY, newRole);
      } catch (error) {
        console.error('Error saving role:', error);
      }
    } else {
      try {
        await SecureStore.deleteItemAsync(ROLE_STORAGE_KEY);
      } catch (error) {
        console.error('Error deleting role:', error);
      }
    }
  };

  return (
    <UserContext.Provider value={{ role, setRole, isLoading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUserRole = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUserRole must be used within a UserProvider');
  }
  return context;
};