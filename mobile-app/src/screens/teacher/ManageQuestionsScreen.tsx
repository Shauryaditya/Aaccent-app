import React from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Button, Chip, Divider, HelperText, IconButton, Text, TextInput } from 'react-native-paper';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { testService } from '../../services/testService';
import { Question, TeacherStackParamList, Test } from '../../types';
import { handleApiError, showToast } from '../../utils/helpers';
import { colors, radius, shadow, spacing } from '../../theme/design';

type RouteProps = RouteProp<TeacherStackParamList, 'ManageQuestions'>;

type OptionDraft = { optionText: string; isCorrect: boolean };

type QuestionForm = {
  questionText: string;
  questionType: Question['questionType'];
  marks: string;
  negativeMarks: string;
  explanation: string;
  options: OptionDraft[];
};

const QUESTION_TYPES: Array<{ value: Question['questionType']; label: string }> = [
  { value: 'SINGLE_CHOICE', label: 'Single choice' },
  { value: 'MULTIPLE_CHOICE', label: 'Multiple choice' },
  { value: 'TRUE_FALSE', label: 'True / False' },
  { value: 'NUMERICAL', label: 'Numerical' },
];

const CHOICE_TYPES: Question['questionType'][] = ['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE'];

const emptyForm: QuestionForm = {
  questionText: '',
  questionType: 'SINGLE_CHOICE',
  marks: '4',
  negativeMarks: '1',
  explanation: '',
  options: [
    { optionText: '', isCorrect: false },
    { optionText: '', isCorrect: false },
  ],
};

const ManageQuestionsScreen: React.FC = () => {
  const route = useRoute<RouteProps>();
  const { testId } = route.params;
  const queryClient = useQueryClient();

  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<QuestionForm>(emptyForm);
  const [touched, setTouched] = React.useState(false);

  const { data: test } = useQuery<Test>({
    queryKey: ['teacher-test', testId],
    queryFn: () => testService.getTestById(testId),
  });

  const {
    data: questions = [],
    isLoading,
    isFetching,
    refetch,
  } = useQuery<Question[]>({
    queryKey: ['teacher-questions', testId],
    queryFn: () => testService.getQuestions(testId),
  });

  const isChoiceType = CHOICE_TYPES.includes(form.questionType);
  const correctCount = form.options.filter((option) => option.isCorrect).length;
  const filledOptions = form.options.filter((option) => option.optionText.trim());

  const isNumerical = form.questionType === 'NUMERICAL';

  const validationError = React.useMemo(() => {
    if (!form.questionText.trim()) return 'Question text is required';
    if (!Number(form.marks) || Number(form.marks) <= 0) return 'Marks must be greater than zero';
    if (isChoiceType) {
      if (filledOptions.length < 2) return 'Add at least two options';
      if (correctCount === 0) return 'Mark at least one option as correct';
      if (form.questionType === 'SINGLE_CHOICE' && correctCount > 1) {
        return 'Single choice questions allow only one correct option';
      }
    }
    // Numerical answers have no dedicated column, so the expected value is stored as the
    // single correct option. Without it the question cannot be graded.
    if (isNumerical && !form.options[0]?.optionText.trim()) {
      return 'Enter the expected answer';
    }
    return null;
  }, [form, isChoiceType, isNumerical, correctCount, filledOptions.length]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setTouched(false);
  };

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['teacher-questions', testId] });
    queryClient.invalidateQueries({ queryKey: ['teacher-tests'] });
  };

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        questionText: form.questionText.trim(),
        questionType: form.questionType,
        marks: Number(form.marks),
        negativeMarks: Number(form.negativeMarks) || 0,
        explanation: form.explanation.trim() || undefined,
        options: isChoiceType
          ? form.options
              .filter((option) => option.optionText.trim())
              .map((option) => ({ optionText: option.optionText.trim(), isCorrect: option.isCorrect }))
          : isNumerical
          ? [{ optionText: form.options[0].optionText.trim(), isCorrect: true }]
          : undefined,
      };

      return editingId
        ? testService.updateQuestion(editingId, payload)
        : testService.createQuestion(testId, payload);
    },
    onSuccess: () => {
      invalidate();
      showToast('success', editingId ? 'Question updated' : 'Question added');
      resetForm();
    },
    onError: (error) => showToast('error', 'Could not save question', handleApiError(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: (questionId: string) => testService.deleteQuestion(questionId),
    onSuccess: (_result, questionId) => {
      invalidate();
      if (editingId === questionId) resetForm();
      showToast('success', 'Question deleted');
    },
    onError: (error) => showToast('error', 'Could not delete question', handleApiError(error)),
  });

  const startEditing = (question: Question) => {
    setEditingId(question.id);
    setTouched(false);
    setForm({
      questionText: question.questionText,
      questionType: question.questionType,
      marks: String(question.marks),
      negativeMarks: String(question.negativeMarks ?? 0),
      explanation: question.explanation || '',
      options:
        question.options && question.options.length > 0
          ? question.options.map((option) => ({
              optionText: option.optionText,
              isCorrect: option.isCorrect,
            }))
          : [
              { optionText: '', isCorrect: false },
              { optionText: '', isCorrect: false },
            ],
    });
  };

  const confirmDelete = (question: Question) => {
    Alert.alert('Delete question', 'This question will be removed from the test.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(question.id) },
    ]);
  };

  const changeType = (questionType: Question['questionType']) => {
    setForm((current) => ({
      ...current,
      questionType,
      options:
        questionType === 'TRUE_FALSE'
          ? [
              { optionText: 'True', isCorrect: false },
              { optionText: 'False', isCorrect: false },
            ]
          : questionType === 'NUMERICAL'
          ? [{ optionText: '', isCorrect: true }]
          : current.options,
    }));
  };

  const toggleCorrect = (index: number) => {
    setForm((current) => ({
      ...current,
      options: current.options.map((option, optionIndex) => {
        if (current.questionType === 'SINGLE_CHOICE' || current.questionType === 'TRUE_FALSE') {
          return { ...option, isCorrect: optionIndex === index };
        }
        return optionIndex === index ? { ...option, isCorrect: !option.isCorrect } : option;
      }),
    }));
  };

  const updateOptionText = (index: number, optionText: string) => {
    setForm((current) => ({
      ...current,
      options: current.options.map((option, optionIndex) =>
        optionIndex === index ? { ...option, optionText } : option
      ),
    }));
  };

  const addOption = () => {
    setForm((current) => ({
      ...current,
      options: [...current.options, { optionText: '', isCorrect: false }],
    }));
  };

  const removeOption = (index: number) => {
    setForm((current) => ({
      ...current,
      options: current.options.filter((_option, optionIndex) => optionIndex !== index),
    }));
  };

  const handleSave = () => {
    setTouched(true);
    if (validationError) return;
    saveMutation.mutate();
  };

  const totalMarks = questions.reduce((sum, question) => sum + (question.marks || 0), 0);

  if (isLoading) return <LoadingSpinner message="Loading questions..." />;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
      >
        <Text variant="headlineSmall" style={styles.title}>{test?.title || 'Question Bank'}</Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          {questions.length} question{questions.length === 1 ? '' : 's'} · {totalMarks} marks assigned
          {test?.totalMarks ? ` of ${test.totalMarks}` : ''}
        </Text>
        {!!test?.totalMarks && totalMarks !== test.totalMarks && questions.length > 0 && (
          <Text variant="bodySmall" style={styles.warning}>
            Question marks don't add up to the test total yet.
          </Text>
        )}

        {/* Editor */}
        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <Text variant="titleSmall" style={styles.panelTitle}>
              {editingId ? 'Edit question' : 'Add question'}
            </Text>
            {!!editingId && (
              <Button compact mode="text" onPress={resetForm}>Cancel</Button>
            )}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {QUESTION_TYPES.map((type) => (
              <Chip
                key={type.value}
                selected={form.questionType === type.value}
                onPress={() => changeType(type.value)}
                style={[styles.chip, form.questionType === type.value && styles.chipSelected]}
                textStyle={form.questionType === type.value ? styles.chipTextSelected : styles.chipText}
                showSelectedCheck={false}
              >
                {type.label}
              </Chip>
            ))}
          </ScrollView>

          <TextInput
            mode="outlined"
            label="Question"
            value={form.questionText}
            onChangeText={(questionText) => setForm((current) => ({ ...current, questionText }))}
            multiline
            numberOfLines={3}
            style={styles.input}
          />

          <View style={styles.row}>
            <View style={styles.rowItem}>
              <TextInput
                mode="outlined"
                label="Marks"
                value={form.marks}
                onChangeText={(marks) => setForm((current) => ({ ...current, marks }))}
                keyboardType="numeric"
                style={styles.input}
              />
            </View>
            <View style={styles.rowItem}>
              <TextInput
                mode="outlined"
                label="Negative marks"
                value={form.negativeMarks}
                onChangeText={(negativeMarks) => setForm((current) => ({ ...current, negativeMarks }))}
                keyboardType="numeric"
                style={styles.input}
              />
            </View>
          </View>

          {isNumerical && (
            <TextInput
              mode="outlined"
              label="Expected answer"
              value={form.options[0]?.optionText ?? ''}
              onChangeText={(value) =>
                setForm((current) => ({ ...current, options: [{ optionText: value, isCorrect: true }] }))
              }
              keyboardType="numeric"
              style={styles.input}
            />
          )}

          {isChoiceType && (
            <View style={styles.optionsBlock}>
              <Text variant="bodySmall" style={styles.optionsHint}>
                Tap the circle to mark the correct
                {form.questionType === 'MULTIPLE_CHOICE' ? ' answers' : ' answer'}.
              </Text>
              {form.options.map((option, index) => (
                <View key={index} style={styles.optionRow}>
                  <Pressable onPress={() => toggleCorrect(index)} hitSlop={8}>
                    <Ionicons
                      name={option.isCorrect ? 'checkmark-circle' : 'ellipse-outline'}
                      size={26}
                      color={option.isCorrect ? colors.success : colors.muted}
                    />
                  </Pressable>
                  <TextInput
                    mode="outlined"
                    dense
                    placeholder={`Option ${index + 1}`}
                    value={option.optionText}
                    onChangeText={(text) => updateOptionText(index, text)}
                    editable={form.questionType !== 'TRUE_FALSE'}
                    style={styles.optionInput}
                  />
                  {form.questionType !== 'TRUE_FALSE' && form.options.length > 2 && (
                    <IconButton
                      icon="close"
                      size={18}
                      iconColor={colors.muted}
                      onPress={() => removeOption(index)}
                    />
                  )}
                </View>
              ))}
              {form.questionType !== 'TRUE_FALSE' && (
                <Button compact mode="text" icon="plus" onPress={addOption}>Add option</Button>
              )}
            </View>
          )}

          <TextInput
            mode="outlined"
            label="Explanation (optional)"
            value={form.explanation}
            onChangeText={(explanation) => setForm((current) => ({ ...current, explanation }))}
            multiline
            numberOfLines={2}
            style={styles.input}
          />

          {touched && !!validationError && <HelperText type="error">{validationError}</HelperText>}

          <Button
            mode="contained"
            icon={editingId ? 'content-save' : 'plus'}
            onPress={handleSave}
            loading={saveMutation.isPending}
            disabled={saveMutation.isPending}
            style={styles.button}
          >
            {editingId ? 'Save Changes' : 'Add Question'}
          </Button>
        </View>

        <Divider style={styles.divider} />

        {questions.length === 0 ? (
          <EmptyState
            icon="help-circle-outline"
            title="No questions yet"
            message="Add your first question using the form above."
          />
        ) : (
          questions.map((question: Question, index: number) => (
            <View key={question.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text variant="bodySmall" style={styles.cardIndex}>Q{index + 1}</Text>
                <View style={styles.cardActions}>
                  <IconButton icon="pencil" size={18} iconColor={colors.blue} onPress={() => startEditing(question)} />
                  <IconButton
                    icon="trash-can-outline"
                    size={18}
                    iconColor={colors.muted}
                    onPress={() => confirmDelete(question)}
                  />
                </View>
              </View>
              <Text variant="bodyMedium" style={styles.cardQuestion}>{question.questionText}</Text>
              <Text variant="bodySmall" style={styles.cardMeta}>
                {question.questionType.replace(/_/g, ' ').toLowerCase()} · {question.marks} marks
                {question.negativeMarks ? ` · -${question.negativeMarks}` : ''}
              </Text>
              {question.options?.map((option) => (
                <View key={option.id} style={styles.answerRow}>
                  <Ionicons
                    name={option.isCorrect ? 'checkmark-circle' : 'ellipse-outline'}
                    size={16}
                    color={option.isCorrect ? colors.success : colors.muted}
                  />
                  <Text
                    variant="bodySmall"
                    style={[styles.answerText, option.isCorrect && styles.answerCorrect]}
                  >
                    {option.optionText}
                  </Text>
                </View>
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  title: { color: colors.text, fontWeight: '800', marginBottom: spacing.xs },
  subtitle: { color: colors.muted, marginBottom: spacing.xs },
  warning: { color: colors.blue, marginBottom: spacing.md },
  panel: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    ...shadow.card,
  },
  panelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  panelTitle: { color: colors.text, fontWeight: '800' },
  chipRow: { gap: spacing.sm, paddingVertical: spacing.md, paddingRight: spacing.lg },
  chip: { backgroundColor: colors.faint, borderWidth: 1, borderColor: colors.line },
  chipSelected: { backgroundColor: colors.navy, borderColor: colors.navy },
  chipText: { color: colors.muted, fontWeight: '600' },
  chipTextSelected: { color: colors.surface, fontWeight: '700' },
  input: { marginTop: spacing.sm, backgroundColor: colors.surface },
  row: { flexDirection: 'row', gap: spacing.md },
  rowItem: { flex: 1 },
  optionsBlock: { marginTop: spacing.lg },
  optionsHint: { color: colors.muted, marginBottom: spacing.sm },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  optionInput: { flex: 1, backgroundColor: colors.surface },
  button: { borderRadius: radius.sm, marginTop: spacing.lg },
  divider: { marginBottom: spacing.lg },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadow.card,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardIndex: { color: colors.blue, fontWeight: '800' },
  cardActions: { flexDirection: 'row', alignItems: 'center' },
  cardQuestion: { color: colors.text, fontWeight: '600', lineHeight: 21 },
  cardMeta: { color: colors.muted, marginTop: spacing.xs, textTransform: 'capitalize' },
  answerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  answerText: { color: colors.muted, flex: 1 },
  answerCorrect: { color: colors.success, fontWeight: '700' },
});

export default ManageQuestionsScreen;
