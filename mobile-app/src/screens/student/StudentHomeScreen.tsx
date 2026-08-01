import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
import { colors, radius, shadow, spacing } from '../../theme/design';

type NavigationProp = NativeStackNavigationProp<StudentStackParamList>;

const quickActions = [
  { label: 'Lessons', icon: 'play-circle-outline' as const },
  { label: 'Tests', icon: 'checkbox-outline' as const },
  { label: 'Practice', icon: 'create-outline' as const },
  { label: 'Notes', icon: 'document-text-outline' as const },
];

const StudentHomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => apiService.get('/api/categories'),
  });

  const {
    data: courses = [],
    isLoading,
    refetch,
    isFetching,
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
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
      >
        <View style={styles.topBar}>
          <View>
            <Text variant="titleLarge" style={styles.greeting}>Good morning</Text>
            <Text variant="bodyMedium" style={styles.subtle}>Let's make today count.</Text>
          </View>
          <View style={styles.bellButton}>
            <Ionicons name="notifications-outline" size={20} color={colors.navy} />
          </View>
        </View>

        <View style={styles.examCard}>
          <View style={styles.examHeader}>
            <View>
              <Text variant="labelMedium" style={styles.examEyebrow}>Your learning path</Text>
              <Text variant="headlineSmall" style={styles.examTitle}>AI LMS</Text>
            </View>
            <View style={styles.changePill}>
              <Text variant="labelSmall" style={styles.changeText}>Live</Text>
            </View>
          </View>
          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>
          <View style={styles.examFooter}>
            <Text variant="bodySmall" style={styles.examMeta}>Courses ready</Text>
            <Text variant="bodySmall" style={styles.examMetaStrong}>{courses.length} available</Text>
          </View>
        </View>

        <View style={styles.quickGrid}>
          {quickActions.map((action) => (
            <View key={action.label} style={styles.quickItem}>
              <Ionicons name={action.icon} size={20} color={colors.navy} />
              <Text variant="labelSmall" style={styles.quickLabel}>{action.label}</Text>
            </View>
          ))}
        </View>

        <Searchbar
          placeholder="Search courses, tests, notes..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
          iconColor={colors.muted}
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryContainer}
        >
          <Chip
            selected={selectedCategory === null}
            onPress={() => setSelectedCategory(null)}
            style={[styles.categoryChip, selectedCategory === null && styles.categoryChipSelected]}
            textStyle={[styles.categoryText, selectedCategory === null && styles.categoryTextSelected]}
          >
            All
          </Chip>
          {categories.map((category: Category) => (
            <Chip
              key={category.id}
              selected={selectedCategory === category.id}
              onPress={() => setSelectedCategory(category.id)}
              style={[styles.categoryChip, selectedCategory === category.id && styles.categoryChipSelected]}
              textStyle={[styles.categoryText, selectedCategory === category.id && styles.categoryTextSelected]}
            >
              {category.name}
            </Chip>
          ))}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Continue Learning</Text>
          <Text variant="bodySmall" style={styles.sectionLink}>See all</Text>
        </View>

        {courses.length === 0 ? (
          <EmptyState
            icon="book-outline"
            title="No courses found"
            message="Try adjusting your search or filters"
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
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 108,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  greeting: {
    color: colors.text,
    fontWeight: '700',
  },
  subtle: {
    color: colors.muted,
    marginTop: 2,
  },
  bellButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    ...shadow.card,
  },
  examCard: {
    borderRadius: radius.xl,
    backgroundColor: colors.navy,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadow.card,
  },
  examHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xl,
  },
  examEyebrow: {
    color: '#c5cbea',
    marginBottom: 6,
  },
  examTitle: {
    color: colors.surface,
    fontWeight: '800',
  },
  changePill: {
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  changeText: {
    color: colors.surface,
    fontWeight: '700',
  },
  progressTrack: {
    height: 7,
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.18)',
    overflow: 'hidden',
  },
  progressFill: {
    width: '58%',
    height: '100%',
    borderRadius: 99,
    backgroundColor: colors.blue,
  },
  examFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  examMeta: {
    color: '#d5daf3',
  },
  examMetaStrong: {
    color: colors.surface,
    fontWeight: '700',
  },
  quickGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  quickItem: {
    width: '23%',
    minHeight: 70,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
  quickLabel: {
    color: colors.muted,
    marginTop: spacing.sm,
  },
  searchBar: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    elevation: 0,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
  },
  searchInput: {
    fontSize: 14,
  },
  categoryScroll: {
    marginHorizontal: -spacing.lg,
    marginBottom: spacing.xl,
  },
  categoryContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  categoryChip: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1,
  },
  categoryChipSelected: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  categoryText: {
    color: colors.muted,
  },
  categoryTextSelected: {
    color: colors.surface,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    fontWeight: '800',
  },
  sectionLink: {
    color: colors.navy,
  },
});

export default StudentHomeScreen;

