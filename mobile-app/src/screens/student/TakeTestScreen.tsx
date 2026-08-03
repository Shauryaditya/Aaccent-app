import React from 'react';
import { Alert, BackHandler, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { attemptService, testService } from '../../services/testService';
import { Question, StudentStackParamList, Test, TestAttempt } from '../../types';
import { handleApiError, showToast } from '../../utils/helpers';
import { colors, radius, shadow, spacing } from '../../theme/design';

type RouteProps = RouteProp<StudentStackParamList, 'TakeTest'>;
type NavigationProp = NativeStackNavigationProp<StudentStackParamList>;

const formatClock = (totalSeconds: number) => {
  const safe = Math.max(0, totalSeconds);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  const pad = (value: number) => String(value).padStart(2, '0');
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
};

const TakeTestScreen: React.FC = () => {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const queryClient = useQueryClient();
  const { testId } = route.params;

  const [index, setIndex] = React.useState(0);
  // Answers are mirrored locally so the UI stays responsive while saves happen in the
  // background. The server copy is what actually gets graded.
  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [secondsLeft, setSecondsLeft] = React.useState<number | null>(null);
  const hasSubmitted = React.useRef(false);

  const { data: test, isLoading: testLoading } = useQuery<Test>({
    queryKey: ['test', testId],
    queryFn: () => testService.getTestById(testId),
  });

  const { data: questions = [], isLoading: questionsLoading } = useQuery<Question[]>({
    queryKey: ['test-questions', testId],
    queryFn: () => testService.getQuestions(testId),
  });

  const {
    data: attempt,
    isLoading: attemptLoading,
    isError,
    error,
  } = useQuery<TestAttempt & { resumed: boolean }>({
    queryKey: ['attempt-start', testId],
    queryFn: () => attemptService.start(testId),
    retry: false,
    staleTime: Infinity,
  });

  // A finished attempt means the student already sat this test; send them to the result.
  React.useEffect(() => {
    if (attempt?.isCompleted) {
      navigation.replace('TestResult', { attemptId: attempt.id });
    }
  }, [attempt, navigation]);

  // Seed local answers from whatever was already saved, so a resumed attempt is intact.
  React.useEffect(() => {
    if (!attempt?.id || attempt.isCompleted) return;
    attemptService
      .get(attempt.id)
      .then((full) => {
        const restored: Record<string, string> = {};
        full.answers?.forEach((answer) => {
          if (answer.selectedAnswer) restored[answer.questionId] = answer.selectedAnswer;
        });
        setAnswers(restored);
      })
      .catch(() => {
        // Non-fatal: the student simply starts from a blank sheet.
      });
  }, [attempt?.id, attempt?.isCompleted]);

  const submitMutation = useMutation({
    mutationFn: () => attemptService.complete(attempt!.id),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['attempt-start', testId] });
      navigation.replace('TestResult', { attemptId: result.id });
    },
    onError: (err) => {
      hasSubmitted.current = false;
      showToast('error', 'Could not submit test', handleApiError(err));
    },
  });

  const submit = React.useCallback(
    (reason?: 'time') => {
      if (hasSubmitted.current || !attempt?.id) return;
      hasSubmitted.current = true;
      if (reason === 'time') showToast('info', "Time's up", 'Submitting your answers.');
      submitMutation.mutate();
    },
    [attempt?.id, submitMutation]
  );

  // The countdown is derived from the server's startedAt, so backgrounding the app or
  // reopening a resumed attempt cannot hand the student extra time.
  React.useEffect(() => {
    if (!attempt?.startedAt || !test?.duration || attempt.isCompleted) return;

    const endsAt = new Date(attempt.startedAt).getTime() + test.duration * 60 * 1000;

    const tick = () => {
      const remaining = Math.floor((endsAt - Date.now()) / 1000);
      setSecondsLeft(remaining);
      if (remaining <= 0) submit('time');
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [attempt?.startedAt, attempt?.isCompleted, test?.duration, submit]);

  const confirmLeave = React.useCallback(() => {
    Alert.alert('Leave test?', 'Your answers are saved, but the timer keeps running.', [
      { text: 'Stay', style: 'cancel' },
      { text: 'Leave', style: 'destructive', onPress: () => navigation.goBack() },
    ]);
    return true;
  }, [navigation]);

  React.useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', confirmLeave);
    return () => sub.remove();
  }, [confirmLeave]);

  const saveAnswer = (questionId: string, value: string | null) => {
    setAnswers((current) => {
      const next = { ...current };
      if (value) next[questionId] = value;
      else delete next[questionId];
      return next;
    });

    if (!attempt?.id) return;
    attemptService.saveAnswer(attempt.id, questionId, value).catch((err) => {
      showToast('error', 'Answer not saved', handleApiError(err));
    });
  };

  const toggleOption = (question: Question, optionId: string) => {
    const current = answers[question.id];

    if (question.questionType === 'MULTIPLE_CHOICE') {
      const selected = new Set((current || '').split(',').filter(Boolean));
      if (selected.has(optionId)) selected.delete(optionId);
      else selected.add(optionId);
      saveAnswer(question.id, Array.from(selected).join(',') || null);
      return;
    }

    saveAnswer(question.id, current === optionId ? null : optionId);
  };

  if (testLoading || questionsLoading || attemptLoading) {
    return <LoadingSpinner message="Preparing your test..." />;
  }

  if (isError) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="lock-closed-outline"
          title="Can't start this test"
          message={handleApiError(error)}
          actionLabel="Go back"
          onAction={() => navigation.goBack()}
        />
      </View>
    );
  }

  if (questions.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="help-circle-outline"
          title="No questions yet"
          message="This test has no questions. Check back later."
          actionLabel="Go back"
          onAction={() => navigation.goBack()}
        />
      </View>
    );
  }

  const question = questions[index];
  const selected = (answers[question.id] || '').split(',').filter(Boolean);
  const answeredCount = Object.keys(answers).length;
  const isLast = index === questions.length - 1;
  const isTimeCritical = secondsLeft !== null && secondsLeft <= 60;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text variant="bodySmall" style={styles.headerLabel}>
            Question {index + 1} of {questions.length}
          </Text>
          <Text variant="bodySmall" style={styles.headerMeta}>
            {answeredCount} answered · {question.marks} marks
            {question.negativeMarks ? ` · -${question.negativeMarks}` : ''}
          </Text>
        </View>
        {secondsLeft !== null && (
          <View style={[styles.timer, isTimeCritical && styles.timerCritical]}>
            <Ionicons
              name="time-outline"
              size={16}
              color={isTimeCritical ? '#dc2626' : colors.navy}
            />
            <Text style={[styles.timerText, isTimeCritical && styles.timerTextCritical]}>
              {formatClock(secondsLeft)}
            </Text>
          </View>
        )}
      </View>

      {/* Question strip, for jumping around the paper */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.strip}
        contentContainerStyle={styles.stripContent}
      >
        {questions.map((item, itemIndex) => {
          const isAnswered = !!answers[item.id];
          const isCurrent = itemIndex === index;
          return (
            <Pressable
              key={item.id}
              onPress={() => setIndex(itemIndex)}
              style={[styles.pill, isAnswered && styles.pillAnswered, isCurrent && styles.pillCurrent]}
            >
              <Text
                style={[
                  styles.pillText,
                  isAnswered && styles.pillTextAnswered,
                  isCurrent && styles.pillTextCurrent,
                ]}
              >
                {itemIndex + 1}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <Text variant="titleMedium" style={styles.questionText}>
          {question.questionText}
        </Text>

        {question.questionType === 'NUMERICAL' ? (
          <TextInput
            mode="outlined"
            label="Your answer"
            value={answers[question.id] || ''}
            onChangeText={(value) => saveAnswer(question.id, value.trim() || null)}
            keyboardType="numeric"
            style={styles.numericInput}
          />
        ) : (
          question.options?.map((option) => {
            const isSelected = selected.includes(option.id);
            const isMulti = question.questionType === 'MULTIPLE_CHOICE';
            return (
              <Pressable
                key={option.id}
                style={[styles.option, isSelected && styles.optionSelected]}
                onPress={() => toggleOption(question, option.id)}
              >
                <Ionicons
                  name={
                    isMulti
                      ? isSelected
                        ? 'checkbox'
                        : 'square-outline'
                      : isSelected
                      ? 'radio-button-on'
                      : 'radio-button-off'
                  }
                  size={22}
                  color={isSelected ? colors.navy : colors.muted}
                />
                <Text variant="bodyMedium" style={styles.optionText}>
                  {option.optionText}
                </Text>
              </Pressable>
            );
          })
        )}

        {question.questionType === 'MULTIPLE_CHOICE' && (
          <Text variant="bodySmall" style={styles.hint}>
            Select all answers that apply.
          </Text>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          mode="outlined"
          disabled={index === 0}
          onPress={() => setIndex((current) => current - 1)}
          style={styles.footerButton}
        >
          Previous
        </Button>
        {isLast ? (
          <Button
            mode="contained"
            onPress={() =>
              Alert.alert(
                'Submit test?',
                `You have answered ${answeredCount} of ${questions.length} questions. This cannot be undone.`,
                [
                  { text: 'Keep working', style: 'cancel' },
                  { text: 'Submit', onPress: () => submit() },
                ]
              )
            }
            loading={submitMutation.isPending}
            disabled={submitMutation.isPending}
            style={styles.footerButton}
          >
            Submit
          </Button>
        ) : (
          <Button
            mode="contained"
            onPress={() => setIndex((current) => current + 1)}
            style={styles.footerButton}
          >
            Next
          </Button>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerLabel: { color: colors.text, fontWeight: '800' },
  headerMeta: { color: colors.muted, marginTop: 2 },
  timer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.blueSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  timerCritical: { backgroundColor: '#fee2e2' },
  timerText: { color: colors.navy, fontWeight: '800' },
  timerTextCritical: { color: '#dc2626' },
  strip: { maxHeight: 56, flexGrow: 0 },
  stripContent: { gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  pill: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillAnswered: { backgroundColor: colors.tealSoft, borderColor: colors.teal },
  pillCurrent: { borderColor: colors.navy, borderWidth: 2 },
  pillText: { color: colors.muted, fontWeight: '700' },
  pillTextAnswered: { color: colors.navy },
  pillTextCurrent: { color: colors.navy, fontWeight: '800' },
  body: { flex: 1 },
  bodyContent: { padding: spacing.lg, paddingBottom: spacing.xxl },
  questionText: { color: colors.text, fontWeight: '700', lineHeight: 24, marginBottom: spacing.lg },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    minHeight: 56,
    ...shadow.card,
  },
  optionSelected: { borderColor: colors.navy, backgroundColor: colors.blueSoft },
  optionText: { color: colors.text, flex: 1 },
  numericInput: { backgroundColor: colors.surface },
  hint: { color: colors.muted, marginTop: spacing.sm },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.surface,
  },
  footerButton: { flex: 1, borderRadius: radius.sm },
});

export default TakeTestScreen;
