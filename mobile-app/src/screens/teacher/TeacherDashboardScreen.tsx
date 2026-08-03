import React from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { useUser } from '@clerk/clerk-expo';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { teacherService } from '../../services/teacherService';
import { TeacherStackParamList, TeacherStats, TestSubmission } from '../../types';
import { formatCurrency } from '../../utils/format';
import { formatDateRelative } from '../../utils/date';
import { handleApiError } from '../../utils/helpers';
import { colors, radius, shadow, spacing } from '../../theme/design';

type NavigationProp = NativeStackNavigationProp<TeacherStackParamList>;

const StatCard: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string | number;
  tint: string;
  tintSoft: string;
  onPress?: () => void;
}> = ({ icon, label, value, tint, tintSoft, onPress }) => (
  <Pressable style={styles.statCard} onPress={onPress} disabled={!onPress}>
    <View style={[styles.statIcon, { backgroundColor: tintSoft }]}>
      <Ionicons name={icon} size={20} color={tint} />
    </View>
    <Text variant="headlineSmall" style={styles.statValue}>{value}</Text>
    <Text variant="bodySmall" style={styles.statLabel}>{label}</Text>
  </Pressable>
);

const TeacherDashboardScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useUser();

  const { data: stats, isLoading, isFetching, refetch, error } = useQuery<TeacherStats>({
    queryKey: ['teacher-stats'],
    queryFn: teacherService.getStats,
  });

  if (isLoading) return <LoadingSpinner message="Loading dashboard..." />;

  if (error || !stats) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.muted} />
        <Text variant="titleMedium" style={styles.errorTitle}>Could not load dashboard</Text>
        <Text variant="bodySmall" style={styles.errorMessage}>
          {error ? handleApiError(error) : 'No data available.'}
        </Text>
        <Button mode="outlined" onPress={() => refetch()} style={styles.retryButton}>Retry</Button>
      </View>
    );
  }

  const { totals, revenue, topCourses, recentSubmissions } = stats;
  const maxEnrollments = Math.max(...topCourses.map((course) => course.enrollments), 1);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
    >
      <Text variant="bodyMedium" style={styles.greeting}>
        Welcome back{user?.firstName ? `, ${user.firstName}` : ''}
      </Text>
      <Text variant="headlineSmall" style={styles.title}>Dashboard</Text>

      <View style={styles.statGrid}>
        <StatCard
          icon="people-outline"
          label="Students"
          value={totals.students}
          tint={colors.navy}
          tintSoft={colors.blueSoft}
          onPress={() => navigation.navigate('Students')}
        />
        <StatCard
          icon="document-text-outline"
          label="Awaiting review"
          value={totals.pendingSubmissions}
          tint={colors.blue}
          tintSoft={colors.blueSoft}
        />
        <StatCard
          icon="book-outline"
          label="Courses"
          value={`${totals.publishedCourses}/${totals.courses}`}
          tint={colors.navy}
          tintSoft={colors.tealSoft}
        />
        <StatCard
          icon="clipboard-outline"
          label="Test series"
          value={`${totals.publishedTestSeries}/${totals.testSeries}`}
          tint={colors.navy}
          tintSoft={colors.tealSoft}
        />
      </View>

      <View style={styles.revenuePanel}>
        <Text variant="bodySmall" style={styles.revenueLabel}>Estimated revenue</Text>
        <Text variant="headlineMedium" style={styles.revenueValue}>
          {formatCurrency(revenue.estimatedTotal)}
        </Text>
        <View style={styles.revenueSplit}>
          <View style={styles.revenueItem}>
            <Text variant="bodySmall" style={styles.revenueItemLabel}>Courses</Text>
            <Text variant="titleSmall" style={styles.revenueItemValue}>
              {formatCurrency(revenue.coursePurchases)}
            </Text>
          </View>
          <View style={styles.revenueDivider} />
          <View style={styles.revenueItem}>
            <Text variant="bodySmall" style={styles.revenueItemLabel}>Test series</Text>
            <Text variant="titleSmall" style={styles.revenueItemValue}>
              {formatCurrency(revenue.testSeriesPurchases)}
            </Text>
          </View>
        </View>
        <Text variant="bodySmall" style={styles.revenueNote}>
          Based on current listed prices at time of purchase count.
        </Text>
      </View>

      <View style={styles.actionRow}>
        <Button
          mode="contained-tonal"
          icon="account-group"
          style={styles.actionButton}
          onPress={() => navigation.navigate('Students')}
        >
          Students
        </Button>
        <Button
          mode="contained-tonal"
          icon="flag"
          style={styles.actionButton}
          onPress={() => navigation.navigate('AssignGoal', {})}
        >
          Assign Goal
        </Button>
      </View>

      <Text variant="titleMedium" style={styles.sectionTitle}>Top courses by enrolment</Text>
      {topCourses.length === 0 ? (
        <Text variant="bodySmall" style={styles.emptyHint}>No enrolments yet.</Text>
      ) : (
        <View style={styles.panel}>
          {topCourses.map((course) => (
            <View key={course.id} style={styles.barRow}>
              <Text variant="bodySmall" style={styles.barLabel} numberOfLines={1}>
                {course.title}
              </Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    { width: `${Math.max((course.enrollments / maxEnrollments) * 100, 4)}%` },
                  ]}
                />
              </View>
              <Text variant="bodySmall" style={styles.barValue}>{course.enrollments}</Text>
            </View>
          ))}
        </View>
      )}

      <Text variant="titleMedium" style={styles.sectionTitle}>Recent submissions</Text>
      {recentSubmissions.length === 0 ? (
        <Text variant="bodySmall" style={styles.emptyHint}>Nothing submitted yet.</Text>
      ) : (
        recentSubmissions.map((submission: TestSubmission) => (
          <Pressable
            key={submission.id}
            style={styles.card}
            onPress={() =>
              navigation.navigate('ReviewSubmission', { submissionId: submission.id, type: 'test' })
            }
          >
            <View style={styles.cardBody}>
              <Text variant="titleSmall" style={styles.cardTitle}>
                {submission.testChapter?.title || 'Test chapter'}
              </Text>
              <Text variant="bodySmall" style={styles.cardMeta}>
                {submission.testChapter?.testSeries?.title || 'Test series'} ·{' '}
                {formatDateRelative(submission.createdAt)}
              </Text>
            </View>
            <Text
              variant="bodySmall"
              style={[styles.status, submission.status === 'REVIEWED' && styles.statusReviewed]}
            >
              {submission.status}
            </Text>
          </Pressable>
        ))
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
  greeting: { color: colors.muted },
  title: { color: colors.text, fontWeight: '800', marginBottom: spacing.lg },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  statCard: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
    ...shadow.card,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  statValue: { color: colors.text, fontWeight: '800' },
  statLabel: { color: colors.muted, marginTop: 2 },
  revenuePanel: {
    backgroundColor: colors.navy,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.lg,
  },
  revenueLabel: { color: colors.teal, fontWeight: '700' },
  revenueValue: { color: colors.surface, fontWeight: '800', marginTop: spacing.xs },
  revenueSplit: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.lg },
  revenueItem: { flex: 1 },
  revenueItemLabel: { color: colors.teal },
  revenueItemValue: { color: colors.surface, fontWeight: '700', marginTop: 2 },
  revenueDivider: { width: 1, height: 32, backgroundColor: colors.navySoft, marginHorizontal: spacing.md },
  revenueNote: { color: colors.teal, marginTop: spacing.md, opacity: 0.8 },
  actionRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  actionButton: { flex: 1, borderRadius: radius.sm },
  sectionTitle: { color: colors.text, fontWeight: '800', marginTop: spacing.xl, marginBottom: spacing.md },
  emptyHint: { color: colors.muted, fontStyle: 'italic' },
  panel: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
    ...shadow.card,
  },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  barLabel: { color: colors.text, flex: 1.2, fontWeight: '600' },
  barTrack: { flex: 2, height: 8, borderRadius: 4, backgroundColor: colors.faint, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4, backgroundColor: colors.teal },
  barValue: { color: colors.muted, fontWeight: '700', width: 28, textAlign: 'right' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    ...shadow.card,
  },
  cardBody: { flex: 1 },
  cardTitle: { color: colors.text, fontWeight: '800' },
  cardMeta: { color: colors.muted, marginTop: 4 },
  status: { color: colors.blue, fontWeight: '800' },
  statusReviewed: { color: colors.success },
});

export default TeacherDashboardScreen;
