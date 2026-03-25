import React from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StudentStackParamList, Course } from '../../types';
import { courseService } from '../../services/courseService';
import CourseCard from '../../components/common/CourseCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

type NavigationProp = NativeStackNavigationProp<StudentStackParamList>;

const MyCoursesScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  const {
    data: courses = [],
    isLoading,
    refetch,
    isRefreshing,
  } = useQuery<Course[]>({
    queryKey: ['my-courses'],
    queryFn: courseService.getPurchasedCourses,
  });

  const handleCoursePress = (courseId: string) => {
    navigation.navigate('CourseDetail', { courseId });
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading your courses..." />;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refetch} />}
      >
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>
            My Courses
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            {courses.length} {courses.length === 1 ? 'course' : 'courses'} enrolled
          </Text>
        </View>

        <View style={styles.coursesContainer}>
          {courses.length === 0 ? (
            <EmptyState
              icon="book-outline"
              title="No courses yet"
              message="Start learning by enrolling in a course"
              actionLabel="Browse Courses"
              onAction={() => navigation.navigate('Home')}
            />
          ) : (
            courses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                onPress={() => handleCoursePress(course.id)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    elevation: 2,
    marginBottom: 8,
  },
  title: {
    marginBottom: 4,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#666',
  },
  coursesContainer: {
    padding: 16,
  },
});

export default MyCoursesScreen;