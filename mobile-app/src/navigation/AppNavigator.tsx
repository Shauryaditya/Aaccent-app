import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '@clerk/clerk-expo';
import { useUserRole } from '../contexts/UserContext';
import { ActivityIndicator, View } from 'react-native';

import AuthNavigator from './AuthNavigator';
import StudentNavigator from './StudentNavigator';
import TeacherNavigator from './TeacherNavigator';
import RoleSelectionScreen from '../screens/shared/RoleSelectionScreen';

const Stack = createNativeStackNavigator();

const AppNavigator: React.FC = () => {
  const { isSignedIn, isLoaded } = useAuth();
  const { role, isLoading: roleLoading } = useUserRole();

  if (!isLoaded || roleLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isSignedIn ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : !role ? (
          <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
        ) : role === 'student' ? (
          <Stack.Screen name="Student" component={StudentNavigator} />
        ) : (
          <Stack.Screen name="Teacher" component={TeacherNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;