import React from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Text, Button, IconButton } from 'react-native-paper';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import * as WebBrowser from 'expo-web-browser';
import { StudentStackParamList, Attachment, Chapter, Course } from '../../types';
import { courseService } from '../../services/courseService';
import { usePurchase } from '../../hooks/usePurchase';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ChapterCard from '../../components/common/ChapterCard';
import ProgressBar from '../../components/common/ProgressBar';
import { formatCurrency } from '../../utils/format';
import { showToast } from '../../utils/helpers';
import { colors, radius, shadow, spacing } from '../../theme/design';

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

  const { hasCourse, purchase, isPurchasing, isLoadingEntitlements } = usePurchase();

  const handleEnroll = () => {
    purchase({ type: 'course', id: courseId });
  };

  const handleChapterPress = (chapterId: string) => {
    navigation.navigate('ChapterView', { chapterId, courseId });
  };

  const openUrl = async (url: string) => {
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch (error) {
      showToast('error', 'Could not open attachment');
    }
  };

  if (isLoading || !course) {
    return <LoadingSpinner message="Loading course details..." />;
  }

  const isPurchased = hasCourse(courseId) || course.progress !== undefined;
  const chapters = course.chapters || [];
  const attachments = course.attachments || [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {course.imageUrl && <View style={styles.imageContainer} />}

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

        {!isPurchased && !isLoadingEntitlements && course.price !== undefined && course.price > 0 && (
          <View style={styles.priceContainer}>
            <Text variant="headlineSmall" style={styles.price}>
              {formatCurrency(course.price)}
            </Text>
            <Button
              mode="contained"
              onPress={handleEnroll}
              loading={isPurchasing}
              disabled={isPurchasing}
              style={styles.enrollButton}
            >
              {isPurchasing ? 'Completing payment...' : 'Enroll Now'}
            </Button>
            <Text variant="bodySmall" style={styles.payNote}>
              You'll pay securely via Razorpay, then return to the app.
            </Text>
          </View>
        )}

        {attachments.length > 0 && (
          <View style={styles.attachmentsContainer}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Course Attachments</Text>
            {attachments.map((attachment: Attachment) => (
              <Pressable key={attachment.id} style={styles.attachment} onPress={() => openUrl(attachment.url)}>
                <View style={styles.attachmentIcon}>
                  <IconButton icon="file-document-outline" size={20} iconColor={colors.navy} />
                </View>
                <View style={styles.attachmentBody}>
                  <Text variant="bodyMedium" style={styles.attachmentName} numberOfLines={1}>
                    {attachment.name || 'Attachment'}
                  </Text>
                  <Text variant="bodySmall" style={styles.attachmentMeta}>Tap to open</Text>
                </View>
                <IconButton icon="open-in-new" size={18} iconColor={colors.muted} />
              </Pressable>
            ))}
          </View>
        )}

        <View style={styles.chaptersContainer}>
          <Text variant="titleLarge" style={styles.chaptersTitle}>
            Course Content
          </Text>
          <Text variant="bodyMedium" style={styles.chaptersSubtitle}>
            {chapters.length} {chapters.length === 1 ? 'chapter' : 'chapters'}
          </Text>

          {chapters.map((chapter: Chapter) => (
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
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  imageContainer: {
    height: 200,
    backgroundColor: '#e5e7eb',
  },
  content: {
    padding: spacing.lg,
  },
  title: {
    marginBottom: spacing.sm,
    fontWeight: '800',
    color: colors.text,
  },
  category: {
    color: colors.blue,
    marginBottom: spacing.md,
  },
  description: {
    color: '#4b5563',
    marginBottom: spacing.lg,
    lineHeight: 24,
  },
  progressContainer: {
    marginBottom: spacing.xl,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    ...shadow.card,
  },
  progressTitle: {
    marginBottom: spacing.md,
    fontWeight: '700',
  },
  priceContainer: {
    marginBottom: spacing.xl,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    ...shadow.card,
  },
  price: {
    color: colors.success,
    marginBottom: spacing.lg,
    fontWeight: '800',
  },
  enrollButton: {
    width: '100%',
    borderRadius: radius.sm,
  },
  payNote: {
    color: colors.muted,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  attachmentsContainer: {
    marginBottom: spacing.xl,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    ...shadow.card,
  },
  sectionTitle: {
    marginBottom: spacing.sm,
    fontWeight: '800',
    color: colors.text,
  },
  attachment: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  attachmentIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.sm,
    backgroundColor: colors.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  attachmentBody: {
    flex: 1,
  },
  attachmentName: {
    color: colors.text,
    fontWeight: '600',
  },
  attachmentMeta: {
    color: colors.muted,
    marginTop: 2,
  },
  chaptersContainer: {
    marginTop: spacing.sm,
  },
  chaptersTitle: {
    marginBottom: 4,
    fontWeight: '800',
    color: colors.text,
  },
  chaptersSubtitle: {
    color: colors.muted,
    marginBottom: spacing.lg,
  },
});

export default CourseDetailScreen;
