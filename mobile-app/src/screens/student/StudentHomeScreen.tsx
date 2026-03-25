import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Searchbar, Chip } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StudentStackParamList, Course, Category } from '../../types';
import { courseService } from '../../services/courseService';
import { apiService } from '../../services/api';
import CourseCard from '../../components/common/CourseCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

type NavigationProp = NativeStackNavigationProp<StudentStackParamList>;

const StudentHomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Fetch categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => apiService.get('/api/courses/categories'),
  });

  // Fetch courses
  const {
    data: courses = [],
    isLoading,
    refetch,
    isRefreshing,
  } = useQuery<Course[]>({
    queryKey: ['courses', selectedCategory, searchQuery],
    queryFn: () =>
      courseService.getCourses({
        categoryId: selectedCategory || undefined,
        title: searchQuery || undefined,
      }),
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
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refetch} />}
      >
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>
            Explore Courses
          </Text>
          <Searchbar
            placeholder="Search courses..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryContainer}
        >
          <Chip
            selected={selectedCategory === null}
            onPress={() => setSelectedCategory(null)}
            style={styles.categoryChip}
          >
            All
          </Chip>
          {categories.map((category) => (
            <Chip
              key={category.id}
              selected={selectedCategory === category.id}
              onPress={() => setSelectedCategory(category.id)}
              style={styles.categoryChip}
            >
              {category.name}
            </Chip>
          ))}
        </ScrollView>

        <View style={styles.coursesContainer}>
          {courses.length === 0 ? (
            <EmptyState
              icon="book-outline"
              title="No courses found"
              message="Try adjusting your search or filters"
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
  },
  title: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  searchBar: {
    elevation: 0,
    backgroundColor: '#f3f4f6',
  },
  categoryScroll: {
    backgroundColor: '#fff',
    paddingVertical: 12,
  },
  categoryContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    marginRight: 0,
  },
  coursesContainer: {
    padding: 16,
  },
});

export default StudentHomeScreen;