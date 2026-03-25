import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClerkProvider } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import Toast from 'react-native-toast-message';

import AppNavigator from './src/navigation/AppNavigator';
import { UserProvider } from './src/contexts/UserContext';

// Create a QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Token cache for Clerk
const tokenCache = {
  async getToken(key: string) {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error('SecureStore get error:', error);
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error('SecureStore save error:', error);
    }
  },
};

// Get Clerk key from config
const clerkPublishableKey = Constants.expoConfig?.extra?.clerkPublishableKey || '';

if (!clerkPublishableKey) {
  console.error(
    'Missing Clerk Publishable Key. Please set it in app.json under extra.clerkPublishableKey'
  );
}

export default function App() {
  return (
    <ClerkProvider publishableKey={clerkPublishableKey} tokenCache={tokenCache}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <PaperProvider>
            <UserProvider>
              <StatusBar style="auto" />
              <AppNavigator />
              <Toast />
            </UserProvider>
          </PaperProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}
