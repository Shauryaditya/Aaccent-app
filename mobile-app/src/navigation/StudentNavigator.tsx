import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StudentStackParamList, StudentTabParamList } from '../types';
import { colors } from '../theme/design';

import StudentHomeScreen from '../screens/student/StudentHomeScreen';
import MyCoursesScreen from '../screens/student/MyCoursesScreen';
import MyTestsScreen from '../screens/student/MyTestsScreen';
import MyGoalsScreen from '../screens/student/MyGoalsScreen';
import StudentProfileScreen from '../screens/student/StudentProfileScreen';

import CourseDetailScreen from '../screens/student/CourseDetailScreen';
import ChapterViewScreen from '../screens/student/ChapterViewScreen';
import TestDetailScreen from '../screens/student/TestDetailScreen';
import TakeTestScreen from '../screens/student/TakeTestScreen';
import TestResultScreen from '../screens/student/TestResultScreen';
import SubmitAssignmentScreen from '../screens/student/SubmitAssignmentScreen';
import ResourcesScreen from '../screens/student/ResourcesScreen';

const Tab = createBottomTabNavigator<StudentTabParamList>();
const Stack = createNativeStackNavigator<StudentStackParamList>();

const StudentTabs: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.navy,
        tabBarInactiveTintColor: '#9aa3b8',
        tabBarStyle: {
          height: 72,
          paddingTop: 8,
          paddingBottom: 10,
          borderTopColor: colors.faint,
          backgroundColor: colors.surface,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={StudentHomeScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="MyCourses"
        component={MyCoursesScreen}
        options={{
          tabBarLabel: 'Library',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="library-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Tests"
        component={MyTestsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="checkbox-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Goals"
        component={MyGoalsScreen}
        options={{
          tabBarLabel: 'Plan',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={StudentProfileScreen}
        options={{
          tabBarLabel: 'More',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="ellipsis-horizontal" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const StudentNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerTintColor: colors.navy,
        headerTitleStyle: { color: colors.text, fontWeight: '700' },
      }}
    >
      <Stack.Screen
        name="StudentTabs"
        component={StudentTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CourseDetail"
        component={CourseDetailScreen}
        options={{ title: 'Course Details' }}
      />
      <Stack.Screen
        name="ChapterView"
        component={ChapterViewScreen}
        options={{ title: 'Chapter' }}
      />
      <Stack.Screen
        name="TestDetail"
        component={TestDetailScreen}
        options={{ title: 'Test Details' }}
      />
      <Stack.Screen
        name="TakeTest"
        component={TakeTestScreen}
        options={{
          title: 'Take Test',
          headerLeft: () => null,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="TestResult"
        component={TestResultScreen}
        options={{ title: 'Test Results' }}
      />
      <Stack.Screen
        name="SubmitAssignment"
        component={SubmitAssignmentScreen}
        options={{ title: 'Submit Assignment' }}
      />
      <Stack.Screen
        name="Resources"
        component={ResourcesScreen}
        options={{ title: 'Resources Library' }}
      />
    </Stack.Navigator>
  );
};

export default StudentNavigator;
