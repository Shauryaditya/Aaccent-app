import React from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { Course, TeacherStackParamList } from '../../types';
import { courseService } from '../../services/courseService';
import CourseCard from '../../components/common/CourseCard';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const TeacherCoursesScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<TeacherStackParamList>>();

  const {
    data: courses = [],
    isLoading,
    isFetching,
    refetch,
  } = useQuery<Course[]>({
    queryKey: ['teacher-courses'],
    queryFn: () => courseService.getTeacherCourses(),
  });

  if (isLoading) {
    return <LoadingSpinner message="Loading courses..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text variant="headlineSmall" style={styles.title}>Courses</Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            {courses.length} {courses.length === 1 ? 'course' : 'courses'} created
          </Text>
        </View>
        <Button
          mode="contained"
          icon="plus"
          onPress={() => navigation.navigate('CreateCourse')}
        >
          Create
        </Button>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
      >
        {courses.length === 0 ? (
          <EmptyState
            icon="book-outline"
            title="No courses yet"
            message="Create your first course to start building your LMS content."
            actionLabel="Create Course"
            onAction={() => navigation.navigate('CreateCourse')}
          />
        ) : (
          courses.map((course: Course) => (
            <CourseCard
              key={course.id}
              course={course}
              onPress={() => navigation.navigate('EditCourse', { courseId: course.id })}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
  },
  title: {
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#666',
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    flexGrow: 1,
  },
});

export default TeacherCoursesScreen;
