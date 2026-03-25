import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { TeacherStackParamList, TeacherTabParamList } from '../types';

// Tab Screens
import TeacherDashboardScreen from '../screens/teacher/TeacherDashboardScreen';
import TeacherCoursesScreen from '../screens/teacher/TeacherCoursesScreen';
import TeacherTestSeriesScreen from '../screens/teacher/TeacherTestSeriesScreen';
import SubmissionsScreen from '../screens/teacher/SubmissionsScreen';
import TeacherProfileScreen from '../screens/teacher/TeacherProfileScreen';

// Stack Screens
import CreateCourseScreen from '../screens/teacher/CreateCourseScreen';
import EditCourseScreen from '../screens/teacher/EditCourseScreen';
import ManageChaptersScreen from '../screens/teacher/ManageChaptersScreen';
import CreateTestSeriesScreen from '../screens/teacher/CreateTestSeriesScreen';
import EditTestSeriesScreen from '../screens/teacher/EditTestSeriesScreen';
import ManageTestsScreen from '../screens/teacher/ManageTestsScreen';
import CreateTestScreen from '../screens/teacher/CreateTestScreen';
import ManageQuestionsScreen from '../screens/teacher/ManageQuestionsScreen';
import ReviewSubmissionScreen from '../screens/teacher/ReviewSubmissionScreen';
import StudentProgressScreen from '../screens/teacher/StudentProgressScreen';
import AssignGoalScreen from '../screens/teacher/AssignGoalScreen';

const Tab = createBottomTabNavigator<TeacherTabParamList>();
const Stack = createNativeStackNavigator<TeacherStackParamList>();

const TeacherTabs: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#9ca3af',
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={TeacherDashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Courses"
        component={TeacherCoursesScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="TestSeries"
        component={TeacherTestSeriesScreen}
        options={{
          tabBarLabel: 'Tests',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="clipboard" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Submissions"
        component={SubmissionsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={TeacherProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const TeacherNavigator: React.FC = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="TeacherTabs"
        component={TeacherTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CreateCourse"
        component={CreateCourseScreen}
        options={{ title: 'Create Course' }}
      />
      <Stack.Screen
        name="EditCourse"
        component={EditCourseScreen}
        options={{ title: 'Edit Course' }}
      />
      <Stack.Screen
        name="ManageChapters"
        component={ManageChaptersScreen}
        options={{ title: 'Manage Chapters' }}
      />
      <Stack.Screen
        name="CreateTestSeries"
        component={CreateTestSeriesScreen}
        options={{ title: 'Create Test Series' }}
      />
      <Stack.Screen
        name="EditTestSeries"
        component={EditTestSeriesScreen}
        options={{ title: 'Edit Test Series' }}
      />
      <Stack.Screen
        name="ManageTests"
        component={ManageTestsScreen}
        options={{ title: 'Manage Tests' }}
      />
      <Stack.Screen
        name="CreateTest"
        component={CreateTestScreen}
        options={{ title: 'Create Test' }}
      />
      <Stack.Screen
        name="ManageQuestions"
        component={ManageQuestionsScreen}
        options={{ title: 'Manage Questions' }}
      />
      <Stack.Screen
        name="ReviewSubmission"
        component={ReviewSubmissionScreen}
        options={{ title: 'Review Submission' }}
      />
      <Stack.Screen
        name="StudentProgress"
        component={StudentProgressScreen}
        options={{ title: 'Student Progress' }}
      />
      <Stack.Screen
        name="AssignGoal"
        component={AssignGoalScreen}
        options={{ title: 'Assign Goal' }}
      />
    </Stack.Navigator>
  );
};

export default TeacherNavigator;