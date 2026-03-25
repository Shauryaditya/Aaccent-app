import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { StudentStackParamList, Course } from '../../types';
import { courseService } from '../../services/courseService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ChapterCard from '../../components/common/ChapterCard';
import ProgressBar from '../../components/common/ProgressBar';
import { formatCurrency } from '../../utils/format';
import { showToast } from '../../utils/helpers';

type RouteProps = RouteProp<StudentStackParamList, 'CourseDetail'>;
type NavigationProp = NativeStackNavigationProp<StudentStackParamList>;

const CourseDetailScreen: React.FC = () => {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const { courseId } = route.params;

  const { data: course, isLoading } = useQuery<Course>({
    queryKey: ['course', courseId],
    queryFn: () => courseService.getCourseWithProgress(courseId),
  });

  const handleEnroll = async () => {
    showToast('info', 'Payment Integration', 'Razorpay integration to be implemented');
  };

  const handleChapterPress = (chapterId: string) => {
    navigation.navigate('ChapterView', { chapterId, courseId });
  };

  if (isLoading || !course) {
    return <LoadingSpinner message="Loading course details..." />;
  }

  const isPurchased = course.progress !== undefined;
  const chapters = course.chapters || [];

  return (
    <ScrollView style={styles.container}>
      {course.imageUrl && (
        <View style={styles.imageContainer}>
          {/* Course image would go here */}
        </View>
      )}

      <View style={styles.content}>
        <Text variant="headlineMedium" style={styles.title}>
          {course.title}
        </Text>

        {course.category && (
          <Text variant="bodyMedium" style={styles.category}>
            {course.category.name}
          </Text>
        )}

        {course.description && (
          <Text variant="bodyLarge" style={styles.description}>
            {course.description}
          </Text>
        )}

        {isPurchased && course.progress !== undefined && (
          <View style={styles.progressContainer}>
            <Text variant="titleMedium" style={styles.progressTitle}>
              Your Progress
            </Text>
            <ProgressBar progress={course.progress} />
          </View>
        )}

        {!isPurchased && course.price !== undefined && course.price > 0 && (
          <View style={styles.priceContainer}>
            <Text variant="headlineSmall" style={styles.price}>
              {formatCurrency(course.price)}
            </Text>
            <Button mode="contained" onPress={handleEnroll} style={styles.enrollButton}>
              Enroll Now
            </Button>
          </View>
        )}

        <View style={styles.chaptersContainer}>
          <Text variant="titleLarge" style={styles.chaptersTitle}>
            Course Content
          </Text>
          <Text variant="bodyMedium" style={styles.chaptersSubtitle}>
            {chapters.length} {chapters.length === 1 ? 'chapter' : 'chapters'}
          </Text>

          {chapters.map((chapter) => (
            <ChapterCard
              key={chapter.id}
              chapter={chapter}
              onPress={() => handleChapterPress(chapter.id)}
              isCompleted={chapter.userProgress?.[0]?.isCompleted || false}
            />
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  imageContainer: {
    height: 200,
    backgroundColor: '#e5e7eb',
  },
  content: {
    padding: 16,
  },
  title: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  category: {
    color: '#6366f1',
    marginBottom: 12,
  },
  description: {
    color: '#4b5563',
    marginBottom: 16,
    lineHeight: 24,
  },
  progressContainer: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 1,
  },
  progressTitle: {
    marginBottom: 12,
  },
  priceContainer: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 2,
    alignItems: 'center',
  },
  price: {
    color: '#16a34a',
    marginBottom: 16,
    fontWeight: 'bold',
  },
  enrollButton: {
    width: '100%',
  },
  chaptersContainer: {
    marginTop: 8,
  },
  chaptersTitle: {
    marginBottom: 4,
    fontWeight: 'bold',
  },
  chaptersSubtitle: {
    color: '#666',
    marginBottom: 16,
  },
});

export default CourseDetailScreen;