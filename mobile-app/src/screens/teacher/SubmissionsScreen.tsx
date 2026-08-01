import React from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { submissionService } from '../../services/submissionService';
import { TeacherStackParamList, TestSubmission } from '../../types';
import { colors, radius, shadow, spacing } from '../../theme/design';

type NavigationProp = NativeStackNavigationProp<TeacherStackParamList>;

const SubmissionsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { data: submissions = [], isLoading, isFetching, refetch } = useQuery<TestSubmission[]>({
    queryKey: ['all-test-submissions'],
    queryFn: () => submissionService.getAllTestSubmissions(),
  });

  if (isLoading) return <LoadingSpinner message="Loading submissions..." />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}>
      <Text variant="headlineSmall" style={styles.title}>Student Submissions</Text>
      {submissions.length === 0 ? (
        <EmptyState icon="document-text-outline" title="No submissions yet" message="Student photo submissions will appear here." />
      ) : submissions.map((submission: TestSubmission) => (
        <Pressable key={submission.id} style={styles.card} onPress={() => navigation.navigate('ReviewSubmission', { submissionId: submission.id, type: 'test' })}>
          <View style={styles.cardBody}>
            <Text variant="titleMedium" style={styles.cardTitle}>{submission.testChapter?.title || 'Test Chapter'}</Text>
            <Text variant="bodySmall" style={styles.cardMeta}>{submission.testChapter?.testSeries?.title || 'Test Series'} · Attempt {submission.attemptNo}</Text>
            <Text variant="bodySmall" style={[styles.status, submission.status === 'REVIEWED' && styles.reviewed]}>{submission.status}</Text>
          </View>
          <Button mode="outlined">Review</Button>
        </Pressable>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  title: { color: colors.text, fontWeight: '800', marginBottom: spacing.lg },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: spacing.md, marginBottom: spacing.md, flexDirection: 'row', alignItems: 'center', ...shadow.card },
  cardBody: { flex: 1 },
  cardTitle: { color: colors.text, fontWeight: '800' },
  cardMeta: { color: colors.muted, marginTop: 4 },
  status: { color: colors.blue, marginTop: spacing.sm, fontWeight: '800' },
  reviewed: { color: colors.success },
});

export default SubmissionsScreen;

