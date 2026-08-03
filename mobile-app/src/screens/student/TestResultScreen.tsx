import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Divider, Text } from 'react-native-paper';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { attemptService } from '../../services/testService';
import { Answer, QuestionOption, StudentStackParamList, TestAttempt } from '../../types';
import { handleApiError } from '../../utils/helpers';
import { colors, radius, shadow, spacing } from '../../theme/design';

type RouteProps = RouteProp<StudentStackParamList, 'TestResult'>;
type NavigationProp = NativeStackNavigationProp<StudentStackParamList>;

const selectedIdsOf = (answer: Answer) =>
  (answer.selectedAnswer || '').split(',').map((value) => value.trim()).filter(Boolean);

const TestResultScreen: React.FC = () => {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const { attemptId } = route.params;

  const { data: attempt, isLoading, isError, error } = useQuery<TestAttempt>({
    queryKey: ['attempt', attemptId],
    queryFn: () => attemptService.get(attemptId),
  });

  if (isLoading) return <LoadingSpinner message="Loading your result..." />;

  if (isError || !attempt) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="alert-circle-outline"
          title="Could not load result"
          message={handleApiError(error)}
          actionLabel="Go back"
          onAction={() => navigation.goBack()}
        />
      </View>
    );
  }

  const answers = attempt.answers || [];
  const correctCount = answers.filter((answer) => answer.isCorrect).length;
  const wrongCount = answers.filter(
    (answer) => answer.isCorrect === false && !!answer.selectedAnswer
  ).length;
  const totalQuestions = answers.length;
  const score = attempt.score ?? 0;
  const percentage = attempt.percentage ?? 0;
  const passed = attempt.isPassed;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={[styles.scoreCard, passed === false && styles.scoreCardFailed]}>
        <Text variant="bodySmall" style={styles.scoreLabel}>
          {attempt.test?.title || 'Your result'}
        </Text>
        <Text style={styles.scoreValue}>
          {score}
          <Text style={styles.scoreTotal}> / {attempt.totalMarks}</Text>
        </Text>
        <Text variant="titleMedium" style={styles.scorePercent}>{percentage}%</Text>

        {passed !== null && passed !== undefined && (
          <View style={[styles.badge, passed ? styles.badgePass : styles.badgeFail]}>
            <Ionicons
              name={passed ? 'checkmark-circle' : 'close-circle'}
              size={16}
              color={passed ? colors.success : '#dc2626'}
            />
            <Text style={[styles.badgeText, passed ? styles.badgeTextPass : styles.badgeTextFail]}>
              {passed ? 'Passed' : 'Not passed'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.statRow}>
        <View style={styles.statTile}>
          <Text style={[styles.statValue, { color: colors.success }]}>{correctCount}</Text>
          <Text variant="bodySmall" style={styles.statLabel}>Correct</Text>
        </View>
        <View style={styles.statTile}>
          <Text style={[styles.statValue, { color: '#dc2626' }]}>{wrongCount}</Text>
          <Text variant="bodySmall" style={styles.statLabel}>Wrong</Text>
        </View>
        <View style={styles.statTile}>
          <Text style={[styles.statValue, { color: colors.muted }]}>
            {totalQuestions - correctCount - wrongCount}
          </Text>
          <Text variant="bodySmall" style={styles.statLabel}>Skipped</Text>
        </View>
      </View>

      <Text variant="titleMedium" style={styles.sectionTitle}>Review</Text>

      {answers.map((answer, index) => {
        const question = answer.question;
        if (!question) return null;

        const selected = selectedIdsOf(answer);
        const wasAnswered = selected.length > 0;
        const isNumerical = question.questionType === 'NUMERICAL';

        return (
          <View key={answer.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text variant="bodySmall" style={styles.cardIndex}>Q{index + 1}</Text>
              <View style={styles.resultTag}>
                <Ionicons
                  name={
                    answer.isCorrect
                      ? 'checkmark-circle'
                      : wasAnswered
                      ? 'close-circle'
                      : 'remove-circle-outline'
                  }
                  size={16}
                  color={answer.isCorrect ? colors.success : wasAnswered ? '#dc2626' : colors.muted}
                />
                <Text
                  variant="bodySmall"
                  style={[
                    styles.resultTagText,
                    answer.isCorrect && { color: colors.success },
                    !answer.isCorrect && wasAnswered && { color: '#dc2626' },
                  ]}
                >
                  {answer.marksAwarded != null && answer.marksAwarded > 0
                    ? `+${answer.marksAwarded}`
                    : answer.marksAwarded != null && answer.marksAwarded < 0
                    ? `${answer.marksAwarded}`
                    : wasAnswered
                    ? '0'
                    : 'Skipped'}
                </Text>
              </View>
            </View>

            <Text variant="bodyMedium" style={styles.questionText}>{question.questionText}</Text>

            {isNumerical ? (
              <View style={styles.numericBlock}>
                <Text variant="bodySmall" style={styles.numericLabel}>
                  Your answer: <Text style={styles.numericValue}>{selected[0] || '—'}</Text>
                </Text>
                <Text variant="bodySmall" style={styles.numericLabel}>
                  Correct answer:{' '}
                  <Text style={[styles.numericValue, { color: colors.success }]}>
                    {question.options?.find((option) => option.isCorrect)?.optionText ?? '—'}
                  </Text>
                </Text>
              </View>
            ) : (
              question.options?.map((option: QuestionOption) => {
                const chosen = selected.includes(option.id);
                return (
                  <View
                    key={option.id}
                    style={[
                      styles.optionRow,
                      option.isCorrect && styles.optionCorrect,
                      chosen && !option.isCorrect && styles.optionWrong,
                    ]}
                  >
                    <Ionicons
                      name={
                        option.isCorrect
                          ? 'checkmark-circle'
                          : chosen
                          ? 'close-circle'
                          : 'ellipse-outline'
                      }
                      size={18}
                      color={option.isCorrect ? colors.success : chosen ? '#dc2626' : colors.muted}
                    />
                    <Text variant="bodySmall" style={styles.optionText}>{option.optionText}</Text>
                    {chosen && (
                      <Text variant="bodySmall" style={styles.yourPick}>your pick</Text>
                    )}
                  </View>
                );
              })
            )}

            {!!question.explanation && (
              <>
                <Divider style={styles.divider} />
                <Text variant="bodySmall" style={styles.explanation}>
                  {question.explanation}
                </Text>
              </>
            )}
          </View>
        );
      })}

      <Button
        mode="contained"
        icon="arrow-left"
        onPress={() => navigation.navigate('StudentTabs')}
        style={styles.doneButton}
      >
        Done
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  scoreCard: {
    backgroundColor: colors.navy,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadow.card,
  },
  scoreCardFailed: { backgroundColor: colors.ink },
  scoreLabel: { color: '#c7d0ea', marginBottom: spacing.sm, textAlign: 'center' },
  scoreValue: { color: '#ffffff', fontSize: 44, fontWeight: '800', lineHeight: 50 },
  scoreTotal: { fontSize: 20, color: '#c7d0ea', fontWeight: '600' },
  scorePercent: { color: '#e6ebf7', marginTop: spacing.xs, fontWeight: '700' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    backgroundColor: '#ffffff',
  },
  badgePass: {},
  badgeFail: {},
  badgeText: { fontWeight: '800' },
  badgeTextPass: { color: colors.success },
  badgeTextFail: { color: '#dc2626' },
  statRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  statTile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  statValue: { fontSize: 24, fontWeight: '800' },
  statLabel: { color: colors.muted, marginTop: 2 },
  sectionTitle: {
    color: colors.text,
    fontWeight: '800',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadow.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  cardIndex: { color: colors.blue, fontWeight: '800' },
  resultTag: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  resultTagText: { color: colors.muted, fontWeight: '800' },
  questionText: { color: colors.text, fontWeight: '600', lineHeight: 21, marginBottom: spacing.md },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    marginBottom: spacing.xs,
  },
  optionCorrect: { backgroundColor: colors.tealSoft },
  optionWrong: { backgroundColor: '#fee2e2' },
  optionText: { color: colors.text, flex: 1 },
  yourPick: { color: colors.muted, fontStyle: 'italic' },
  numericBlock: { gap: spacing.xs },
  numericLabel: { color: colors.muted },
  numericValue: { color: colors.text, fontWeight: '800' },
  divider: { marginVertical: spacing.md },
  explanation: { color: colors.muted, lineHeight: 19 },
  doneButton: { borderRadius: radius.sm, marginTop: spacing.lg },
});

export default TestResultScreen;
