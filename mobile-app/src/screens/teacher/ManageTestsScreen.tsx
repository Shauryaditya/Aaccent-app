import React from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Button, IconButton, Switch, Text } from 'react-native-paper';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { testService } from '../../services/testService';
import { TeacherStackParamList, Test, TestChapter } from '../../types';
import { handleApiError, showToast } from '../../utils/helpers';
import { colors, radius, shadow, spacing } from '../../theme/design';

type RouteProps = RouteProp<TeacherStackParamList, 'ManageTests'>;
type NavigationProp = NativeStackNavigationProp<TeacherStackParamList>;

const ManageTestsScreen: React.FC = () => {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const { testSeriesId } = route.params;
  const queryClient = useQueryClient();

  const {
    data: chapters = [],
    isLoading,
    isFetching,
    refetch,
  } = useQuery<TestChapter[]>({
    queryKey: ['teacher-test-chapters', testSeriesId],
    queryFn: () => testService.getTestChapters(testSeriesId),
  });

  // One tests query per chapter so each list refreshes independently.
  const testQueries = useQueries({
    queries: chapters.map((chapter: TestChapter) => ({
      queryKey: ['teacher-tests', chapter.id],
      queryFn: () => testService.getTests(chapter.id),
    })),
  });

  const invalidateTests = (testChapterId: string) => {
    queryClient.invalidateQueries({ queryKey: ['teacher-tests', testChapterId] });
  };

  const publishMutation = useMutation({
    mutationFn: ({ test }: { test: Test }) =>
      testService.updateTest(test.id, { isPublished: !test.isPublished }),
    onSuccess: (_result, variables) => {
      invalidateTests(variables.test.testChapterId);
      showToast('success', variables.test.isPublished ? 'Test unpublished' : 'Test published');
    },
    onError: (error) => showToast('error', 'Could not update test', handleApiError(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: ({ test }: { test: Test }) => testService.deleteTest(test.id),
    onSuccess: (_result, variables) => {
      invalidateTests(variables.test.testChapterId);
      showToast('success', 'Test deleted');
    },
    onError: (error) => showToast('error', 'Could not delete test', handleApiError(error)),
  });

  const confirmDelete = (test: Test) => {
    Alert.alert('Delete test', `Delete "${test.title}" and all of its questions?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate({ test }) },
    ]);
  };

  if (isLoading) return <LoadingSpinner message="Loading test chapters..." />;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
    >
      <Text variant="headlineSmall" style={styles.title}>Objective Tests</Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        Add timed multiple-choice tests to any chapter of this series.
      </Text>

      {chapters.length === 0 ? (
        <EmptyState
          icon="albums-outline"
          title="No test chapters yet"
          message="Create a test chapter first, then add objective tests to it."
        />
      ) : (
        chapters.map((chapter: TestChapter, index: number) => {
          const query = testQueries[index];
          const tests: Test[] = (query?.data as Test[]) || [];

          return (
            <View key={chapter.id} style={styles.chapterBlock}>
              <View style={styles.chapterHeader}>
                <View style={styles.chapterHeading}>
                  <Text variant="titleMedium" style={styles.chapterTitle}>{chapter.title}</Text>
                  <Text variant="bodySmall" style={styles.chapterMeta}>
                    {query?.isLoading ? 'Loading tests...' : `${tests.length} test${tests.length === 1 ? '' : 's'}`}
                  </Text>
                </View>
                <Button
                  mode="contained-tonal"
                  icon="plus"
                  compact
                  onPress={() => navigation.navigate('CreateTest', { testChapterId: chapter.id })}
                >
                  Add
                </Button>
              </View>

              {tests.length === 0 && !query?.isLoading ? (
                <Text variant="bodySmall" style={styles.noTests}>
                  No objective tests in this chapter yet.
                </Text>
              ) : (
                tests.map((test: Test) => (
                  <Pressable
                    key={test.id}
                    style={styles.card}
                    onPress={() => navigation.navigate('ManageQuestions', { testId: test.id })}
                  >
                    <View style={styles.iconTile}>
                      <Ionicons name="help-circle-outline" size={22} color={colors.navy} />
                    </View>
                    <View style={styles.cardBody}>
                      <Text variant="titleSmall" style={styles.cardTitle}>{test.title}</Text>
                      <Text variant="bodySmall" style={styles.cardMeta}>
                        {test._count?.questions ?? test.questions?.length ?? 0} questions · {test.duration} min · {test.totalMarks} marks
                      </Text>
                      <View style={styles.publishRow}>
                        <Switch
                          value={test.isPublished}
                          onValueChange={() => publishMutation.mutate({ test })}
                          color={colors.success}
                        />
                        <Text variant="bodySmall" style={styles.publishLabel}>
                          {test.isPublished ? 'Published' : 'Draft'}
                        </Text>
                      </View>
                    </View>
                    <IconButton
                      icon="trash-can-outline"
                      iconColor={colors.muted}
                      onPress={() => confirmDelete(test)}
                    />
                  </Pressable>
                ))
              )}
            </View>
          );
        })
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  title: { color: colors.text, fontWeight: '800', marginBottom: spacing.xs },
  subtitle: { color: colors.muted, lineHeight: 22, marginBottom: spacing.lg },
  chapterBlock: { marginBottom: spacing.xl },
  chapterHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  chapterHeading: { flex: 1 },
  chapterTitle: { color: colors.text, fontWeight: '800' },
  chapterMeta: { color: colors.muted, marginTop: 2 },
  noTests: { color: colors.muted, fontStyle: 'italic' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadow.card,
  },
  iconTile: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  cardBody: { flex: 1 },
  cardTitle: { color: colors.text, fontWeight: '800' },
  cardMeta: { color: colors.muted, marginTop: 4 },
  publishRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm, gap: spacing.sm },
  publishLabel: { color: colors.muted, fontWeight: '600' },
});

export default ManageTestsScreen;
