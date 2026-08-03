import React from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Avatar, Button, Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ProgressBar from '../../components/common/ProgressBar';
import { studentService } from '../../services/studentService';
import {
  ChapterSubmission,
  Goal,
  StudentCourseProgress,
  StudentProgressReport,
  TeacherStackParamList,
  TestSubmission,
} from '../../types';
import { formatDate } from '../../utils/date';
import { handleApiError } from '../../utils/helpers';
import { colors, radius, shadow, spacing } from '../../theme/design';

type RouteProps = RouteProp<TeacherStackParamList, 'StudentProgress'>;
type NavigationProp = NativeStackNavigationProp<TeacherStackParamList>;

const initialsOf = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'S';

const StatTile: React.FC<{ label: string; value: string | number; tone?: 'default' | 'alert' }> = ({
  label,
  value,
  tone = 'default',
}) => (
  <View style={styles.statTile}>
    <Text variant="headlineSmall" style={[styles.statValue, tone === 'alert' && styles.statAlert]}>
      {value}
    </Text>
    <Text variant="bodySmall" style={styles.statLabel}>{label}</Text>
  </View>
);

const StudentProgressScreen: React.FC = () => {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const { studentId } = route.params;

  const { data, isLoading, isFetching, refetch, error } = useQuery<StudentProgressReport>({
    queryKey: ['student-progress', studentId],
    queryFn: () => studentService.getStudentProgress(studentId),
  });

  if (isLoading) return <LoadingSpinner message="Loading student progress..." />;

  if (error || !data) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.muted} />
        <Text variant="titleMedium" style={styles.errorTitle}>Could not load progress</Text>
        <Text variant="bodySmall" style={styles.errorMessage}>
          {error ? handleApiError(error) : 'No data available for this student.'}
        </Text>
        <Button mode="outlined" onPress={() => refetch()} style={styles.retryButton}>Retry</Button>
      </View>
    );
  }

  const { student, courses, goals, stats, testSubmissions, chapterSubmissions } = data;
  const pendingTestSubmissions = testSubmissions.filter((item) => item.status === 'SUBMITTED');

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
    >
      <View style={styles.header}>
        {student.imageUrl ? (
          <Avatar.Image size={56} source={{ uri: student.imageUrl }} style={styles.avatar} />
        ) : (
          <Avatar.Text size={56} label={initialsOf(student.name)} style={styles.avatar} />
        )}
        <View style={styles.headerBody}>
          <Text variant="titleLarge" style={styles.studentName}>{student.name}</Text>
          <Text variant="bodySmall" style={styles.studentMeta}>
            {[student.email, student.grade].filter(Boolean).join(' · ') || 'Enrolled student'}
          </Text>
        </View>
      </View>

      <View style={styles.statRow}>
        <StatTile label="Courses" value={stats.coursesEnrolled} />
        <StatTile label="Test series" value={stats.testSeriesEnrolled} />
        <StatTile
          label="Awaiting review"
          value={stats.submissionsPending}
          tone={stats.submissionsPending > 0 ? 'alert' : 'default'}
        />
      </View>

      <Button
        mode="contained"
        icon="flag"
        onPress={() => navigation.navigate('AssignGoal', { studentId })}
        style={styles.assignButton}
      >
        Assign a Goal
      </Button>

      <Text variant="titleMedium" style={styles.sectionTitle}>Course progress</Text>
      {courses.length === 0 ? (
        <Text variant="bodySmall" style={styles.emptyHint}>
          Not enrolled in any of your courses.
        </Text>
      ) : (
        courses.map((course: StudentCourseProgress) => (
          <View key={course.courseId} style={styles.card}>
            <Text variant="titleSmall" style={styles.cardTitle}>{course.title}</Text>
            <Text variant="bodySmall" style={styles.cardMeta}>
              {course.completedChapters} of {course.totalChapters} chapters complete
            </Text>
            <View style={styles.progressWrap}>
              <ProgressBar progress={course.percentage} color={colors.teal} />
            </View>
          </View>
        ))
      )}

      <Text variant="titleMedium" style={styles.sectionTitle}>
        Goals ({stats.goalsCompleted}/{stats.goalsTotal} done)
      </Text>
      {goals.length === 0 ? (
        <Text variant="bodySmall" style={styles.emptyHint}>No goals assigned yet.</Text>
      ) : (
        goals.map((goal: Goal) => (
          <View key={goal.id} style={styles.card}>
            <View style={styles.goalHeader}>
              <Ionicons
                name={goal.isCompleted ? 'checkmark-circle' : 'ellipse-outline'}
                size={20}
                color={goal.isCompleted ? colors.success : colors.muted}
              />
              <Text variant="titleSmall" style={styles.cardTitle}>{goal.title}</Text>
            </View>
            <Text variant="bodySmall" style={styles.cardMeta}>
              Due {formatDate(goal.dueDate, 'dd MMM yyyy')}
              {goal.course ? ` · ${goal.course.title}` : ''}
              {goal.testSeries ? ` · ${goal.testSeries.title}` : ''}
            </Text>
          </View>
        ))
      )}

      <Text variant="titleMedium" style={styles.sectionTitle}>
        Test submissions {pendingTestSubmissions.length > 0 ? `(${pendingTestSubmissions.length} pending)` : ''}
      </Text>
      {testSubmissions.length === 0 ? (
        <Text variant="bodySmall" style={styles.emptyHint}>No test submissions yet.</Text>
      ) : (
        testSubmissions.map((submission: TestSubmission) => (
          <Pressable
            key={submission.id}
            style={styles.card}
            onPress={() =>
              navigation.navigate('ReviewSubmission', { submissionId: submission.id, type: 'test' })
            }
          >
            <View style={styles.submissionRow}>
              <View style={styles.submissionBody}>
                <Text variant="titleSmall" style={styles.cardTitle}>
                  {submission.testChapter?.title || 'Test chapter'}
                </Text>
                <Text variant="bodySmall" style={styles.cardMeta}>
                  Attempt {submission.attemptNo} · {formatDate(submission.createdAt, 'dd MMM yyyy')}
                  {submission.marksAwarded != null ? ` · ${submission.marksAwarded} marks` : ''}
                </Text>
              </View>
              <Text
                variant="bodySmall"
                style={[styles.status, submission.status === 'REVIEWED' && styles.statusReviewed]}
              >
                {submission.status}
              </Text>
            </View>
          </Pressable>
        ))
      )}

      {chapterSubmissions.length > 0 && (
        <>
          <Text variant="titleMedium" style={styles.sectionTitle}>Chapter submissions</Text>
          {chapterSubmissions.map((submission: ChapterSubmission) => (
            <View key={submission.id} style={styles.card}>
              <View style={styles.submissionRow}>
                <View style={styles.submissionBody}>
                  <Text variant="titleSmall" style={styles.cardTitle}>
                    {submission.chapter?.title || 'Chapter'}
                  </Text>
                  <Text variant="bodySmall" style={styles.cardMeta}>
                    {submission.images?.length || 0} photo
                    {(submission.images?.length || 0) === 1 ? '' : 's'} ·{' '}
                    {formatDate(submission.createdAt, 'dd MMM yyyy')}
                  </Text>
                </View>
                <Text
                  variant="bodySmall"
                  style={[styles.status, submission.status === 'REVIEWED' && styles.statusReviewed]}
                >
                  {submission.status}
                </Text>
              </View>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  errorTitle: { color: colors.text, fontWeight: '800', marginTop: spacing.md },
  errorMessage: { color: colors.muted, textAlign: 'center', marginTop: spacing.sm },
  retryButton: { marginTop: spacing.lg, borderRadius: radius.sm },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  avatar: { marginRight: spacing.md, backgroundColor: colors.blueSoft },
  headerBody: { flex: 1 },
  studentName: { color: colors.text, fontWeight: '800' },
  studentMeta: { color: colors.muted, marginTop: 2 },
  statRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  statTile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
    alignItems: 'center',
    ...shadow.card,
  },
  statValue: { color: colors.navy, fontWeight: '800' },
  statAlert: { color: colors.blue },
  statLabel: { color: colors.muted, marginTop: 2, textAlign: 'center' },
  assignButton: { borderRadius: radius.sm, marginBottom: spacing.lg },
  sectionTitle: { color: colors.text, fontWeight: '800', marginTop: spacing.lg, marginBottom: spacing.md },
  emptyHint: { color: colors.muted, fontStyle: 'italic' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadow.card,
  },
  cardTitle: { color: colors.text, fontWeight: '800', flex: 1 },
  cardMeta: { color: colors.muted, marginTop: 4 },
  progressWrap: { marginTop: spacing.md },
  goalHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  submissionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  submissionBody: { flex: 1 },
  status: { color: colors.blue, fontWeight: '800' },
  statusReviewed: { color: colors.success },
});

export default StudentProgressScreen;
