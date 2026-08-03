import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, HelperText, SegmentedButtons, Switch, Text, TextInput } from 'react-native-paper';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { testService } from '../../services/testService';
import { TeacherStackParamList, Test } from '../../types';
import { handleApiError, showToast } from '../../utils/helpers';
import { colors, radius, shadow, spacing } from '../../theme/design';

type RouteProps = RouteProp<TeacherStackParamList, 'CreateTest'>;
type NavigationProp = NativeStackNavigationProp<TeacherStackParamList>;

const CreateTestScreen: React.FC = () => {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const { testChapterId } = route.params;
  const queryClient = useQueryClient();

  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [duration, setDuration] = React.useState('60');
  const [totalMarks, setTotalMarks] = React.useState('100');
  const [passingMarks, setPassingMarks] = React.useState('');
  const [testMode, setTestMode] = React.useState<Test['testMode']>('OBJECTIVE');
  const [isFree, setIsFree] = React.useState(false);
  const [touched, setTouched] = React.useState(false);

  const titleError = touched && !title.trim();
  const durationError = touched && (!Number(duration) || Number(duration) <= 0);
  const totalMarksError = touched && (!Number(totalMarks) || Number(totalMarks) <= 0);
  const passingMarksError =
    touched && !!passingMarks.trim() && Number(passingMarks) > Number(totalMarks);

  const isValid =
    !!title.trim() &&
    Number(duration) > 0 &&
    Number(totalMarks) > 0 &&
    (!passingMarks.trim() || Number(passingMarks) <= Number(totalMarks));

  const createMutation = useMutation({
    mutationFn: () =>
      testService.createTest(testChapterId, {
        title: title.trim(),
        description: description.trim() || undefined,
        duration: Number(duration),
        totalMarks: Number(totalMarks),
        passingMarks: passingMarks.trim() ? Number(passingMarks) : null,
        testMode,
        isFree,
      }),
    onSuccess: (test) => {
      queryClient.invalidateQueries({ queryKey: ['teacher-tests', testChapterId] });
      showToast('success', 'Test created', 'Now add its questions.');
      navigation.replace('ManageQuestions', { testId: test.id });
    },
    onError: (error) => showToast('error', 'Could not create test', handleApiError(error)),
  });

  const handleSubmit = () => {
    setTouched(true);
    if (!isValid) return;
    createMutation.mutate();
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text variant="headlineSmall" style={styles.title}>New Test</Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Set up the test shell first — you can add questions right after.
        </Text>

        <View style={styles.panel}>
          <TextInput
            mode="outlined"
            label="Test title"
            value={title}
            onChangeText={setTitle}
            error={titleError}
            style={styles.input}
          />
          {titleError && <HelperText type="error">Title is required</HelperText>}

          <TextInput
            mode="outlined"
            label="Description (optional)"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            style={styles.input}
          />

          <View style={styles.row}>
            <View style={styles.rowItem}>
              <TextInput
                mode="outlined"
                label="Duration (min)"
                value={duration}
                onChangeText={setDuration}
                keyboardType="number-pad"
                error={durationError}
                style={styles.input}
              />
            </View>
            <View style={styles.rowItem}>
              <TextInput
                mode="outlined"
                label="Total marks"
                value={totalMarks}
                onChangeText={setTotalMarks}
                keyboardType="number-pad"
                error={totalMarksError}
                style={styles.input}
              />
            </View>
          </View>
          {(durationError || totalMarksError) && (
            <HelperText type="error">Duration and total marks must be greater than zero</HelperText>
          )}

          <TextInput
            mode="outlined"
            label="Passing marks (optional)"
            value={passingMarks}
            onChangeText={setPassingMarks}
            keyboardType="number-pad"
            error={passingMarksError}
            style={styles.input}
          />
          {passingMarksError && (
            <HelperText type="error">Passing marks cannot exceed total marks</HelperText>
          )}
        </View>

        <View style={styles.panel}>
          <Text variant="titleSmall" style={styles.panelTitle}>Test mode</Text>
          <SegmentedButtons
            value={testMode}
            onValueChange={(value) => setTestMode(value as Test['testMode'])}
            buttons={[
              { value: 'OBJECTIVE', label: 'Objective' },
              { value: 'DESCRIPTIVE', label: 'Descriptive' },
            ]}
          />
          <Text variant="bodySmall" style={styles.modeHint}>
            {testMode === 'OBJECTIVE'
              ? 'Auto-graded multiple choice, numerical and true/false questions.'
              : 'Students answer on paper and upload photos for manual review.'}
          </Text>

          <View style={styles.switchRow}>
            <View style={styles.switchLabel}>
              <Text variant="bodyMedium" style={styles.switchTitle}>Free preview</Text>
              <Text variant="bodySmall" style={styles.switchHint}>
                Let students take this test without buying the series.
              </Text>
            </View>
            <Switch value={isFree} onValueChange={setIsFree} color={colors.success} />
          </View>
        </View>

        <Button
          mode="contained"
          icon="check"
          onPress={handleSubmit}
          loading={createMutation.isPending}
          disabled={createMutation.isPending}
          style={styles.button}
        >
          Create Test
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  title: { color: colors.text, fontWeight: '800', marginBottom: spacing.xs },
  subtitle: { color: colors.muted, lineHeight: 22, marginBottom: spacing.lg },
  panel: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadow.card,
  },
  panelTitle: { color: colors.text, fontWeight: '800', marginBottom: spacing.md },
  input: { marginTop: spacing.sm, backgroundColor: colors.surface },
  row: { flexDirection: 'row', gap: spacing.md },
  rowItem: { flex: 1 },
  modeHint: { color: colors.muted, marginTop: spacing.sm, lineHeight: 18 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  switchLabel: { flex: 1 },
  switchTitle: { color: colors.text, fontWeight: '700' },
  switchHint: { color: colors.muted, marginTop: 2, lineHeight: 18 },
  button: { borderRadius: radius.sm },
});

export default CreateTestScreen;
