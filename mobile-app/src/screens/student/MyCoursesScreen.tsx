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
import { colors, spacing } from '../../theme/design';

type NavigationProp = NativeStackNavigationProp<StudentStackParamList>;

const MyCoursesScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  const {
    data: courses = [],
    isLoading,
    refetch,
    isFetching,
  } = useQuery<Course[]>({
    queryKey: ['course-library'],
    queryFn: () => courseService.getCourses(),
  });

  const handleCoursePress = (courseId: string) => {
    navigation.navigate('CourseDetail', { courseId });
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading courses..." />;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
      >
        <View style={styles.header}>
          <Text variant="headlineSmall" style={styles.title}>
            Course Library
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            {courses.length} {courses.length === 1 ? 'course' : 'courses'} available
          </Text>
        </View>

        <View style={styles.coursesContainer}>
          {courses.length === 0 ? (
            <EmptyState
              icon="book-outline"
              title="No courses found"
              message="Published courses will appear here."
            />
          ) : (
            courses.map((course: Course) => (
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
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
  },
  title: {
    marginBottom: 4,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    color: colors.muted,
  },
  coursesContainer: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
  },
});

export default MyCoursesScreen;
