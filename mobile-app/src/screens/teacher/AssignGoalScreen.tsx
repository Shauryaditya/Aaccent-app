import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Button, Chip, HelperText, SegmentedButtons, Text, TextInput } from 'react-native-paper';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { addDays, format } from 'date-fns';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { courseService } from '../../services/courseService';
import { goalService } from '../../services/goalService';
import { studentService } from '../../services/studentService';
import { testService } from '../../services/testService';
import { Course, StudentSummary, TeacherStackParamList, TestSeries } from '../../types';
import { handleApiError, showToast } from '../../utils/helpers';
import { colors, radius, shadow, spacing } from '../../theme/design';

type RouteProps = RouteProp<TeacherStackParamList, 'AssignGoal'>;
type NavigationProp = NativeStackNavigationProp<TeacherStackParamList>;

type Target = 'course' | 'testSeries';

const DUE_PRESETS = [
  { label: 'In 3 days', days: 3 },
  { label: 'In 1 week', days: 7 },
  { label: 'In 2 weeks', days: 14 },
  { label: 'In 1 month', days: 30 },
];

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const AssignGoalScreen: React.FC = () => {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const queryClient = useQueryClient();

  const [studentId, setStudentId] = React.useState<string | null>(route.params?.studentId ?? null);
  const [target, setTarget] = React.useState<Target>('course');
  const [courseId, setCourseId] = React.useState<string | null>(null);
  const [testSeriesId, setTestSeriesId] = React.useState<string | null>(null);
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [dueDate, setDueDate] = React.useState(format(addDays(new Date(), 7), 'yyyy-MM-dd'));
  const [touched, setTouched] = React.useState(false);

  // Scope the roster to the selected course/series so only enrolled students show up —
  // the backend rejects goals for students who aren't enrolled.
  const { data: students = [], isLoading: studentsLoading } = useQuery<StudentSummary[]>({
    queryKey: ['teacher-students', target, courseId, testSeriesId],
    queryFn: () =>
      studentService.getStudents(
        target === 'course'
          ? courseId
            ? { courseId }
            : undefined
          : testSeriesId
          ? { testSeriesId }
          : undefined
      ),
  });

  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ['teacher-courses'],
    queryFn: courseService.getTeacherCourses,
  });

  const { data: testSeries = [] } = useQuery<TestSeries[]>({
    queryKey: ['teacher-test-series'],
    queryFn: testService.getTeacherTestSeries,
  });

  // Drop the selected student if they aren't enrolled in the newly picked target.
  React.useEffect(() => {
    if (studentId && students.length > 0 && !students.some((student) => student.id === studentId)) {
      setStudentId(null);
    }
  }, [students, studentId]);

  const validationError = React.useMemo(() => {
    if (!title.trim()) return 'Goal title is required';
    if (!studentId) return 'Select a student';
    if (target === 'course' && !courseId) return 'Select a course';
    if (target === 'testSeries' && !testSeriesId) return 'Select a test series';
    if (!DATE_PATTERN.test(dueDate)) return 'Due date must be in YYYY-MM-DD format';
    if (Number.isNaN(new Date(dueDate).getTime())) return 'Due date is not a valid date';
    return null;
  }, [title, studentId, target, courseId, testSeriesId, dueDate]);

  const createMutation = useMutation({
    mutationFn: () =>
      goalService.createGoal({
        title: title.trim(),
        description: description.trim() || undefined,
        dueDate: new Date(dueDate).toISOString(),
        studentId: studentId!,
        courseId: target === 'course' ? courseId! : undefined,
        testSeriesId: target === 'testSeries' ? testSeriesId! : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-goals'] });
      queryClient.invalidateQueries({ queryKey: ['student-progress'] });
      showToast('success', 'Goal assigned');
      navigation.goBack();
    },
    onError: (error) => showToast('error', 'Could not assign goal', handleApiError(error)),
  });

  const handleSubmit = () => {
    setTouched(true);
    if (validationError) return;
    createMutation.mutate();
  };

  const switchTarget = (next: Target) => {
    setTarget(next);
    setCourseId(null);
    setTestSeriesId(null);
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text variant="headlineSmall" style={styles.title}>Assign a Goal</Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Give a student a dated target tied to one of your courses or test series.
        </Text>

        <View style={styles.panel}>
          <Text variant="titleSmall" style={styles.panelTitle}>Attach to</Text>
          <SegmentedButtons
            value={target}
            onValueChange={(value) => switchTarget(value as Target)}
            buttons={[
              { value: 'course', label: 'Course' },
              { value: 'testSeries', label: 'Test Series' },
            ]}
          />

          <View style={styles.pickerList}>
            {target === 'course' ? (
              courses.length === 0 ? (
                <Text variant="bodySmall" style={styles.emptyHint}>
                  You have no courses yet.
                </Text>
              ) : (
                courses.map((course: Course) => (
                  <Pressable
                    key={course.id}
                    style={[styles.pickerRow, courseId === course.id && styles.pickerRowActive]}
                    onPress={() => setCourseId(course.id)}
                  >
                    <Ionicons
                      name={courseId === course.id ? 'radio-button-on' : 'radio-button-off'}
                      size={20}
                      color={courseId === course.id ? colors.navy : colors.muted}
                    />
                    <Text variant="bodyMedium" style={styles.pickerLabel}>{course.title}</Text>
                  </Pressable>
                ))
              )
            ) : testSeries.length === 0 ? (
              <Text variant="bodySmall" style={styles.emptyHint}>
                You have no test series yet.
              </Text>
            ) : (
              testSeries.map((series: TestSeries) => (
                <Pressable
                  key={series.id}
                  style={[styles.pickerRow, testSeriesId === series.id && styles.pickerRowActive]}
                  onPress={() => setTestSeriesId(series.id)}
                >
                  <Ionicons
                    name={testSeriesId === series.id ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={testSeriesId === series.id ? colors.navy : colors.muted}
                  />
                  <Text variant="bodyMedium" style={styles.pickerLabel}>{series.title}</Text>
                </Pressable>
              ))
            )}
          </View>
        </View>

        <View style={styles.panel}>
          <Text variant="titleSmall" style={styles.panelTitle}>Student</Text>
          {studentsLoading ? (
            <View style={styles.loading}>
              <LoadingSpinner message="Loading students..." />
            </View>
          ) : students.length === 0 ? (
            <EmptyState
              icon="people-outline"
              title="No enrolled students"
              message={
                (target === 'course' && courseId) || (target === 'testSeries' && testSeriesId)
                  ? 'Nobody has enrolled in this yet.'
                  : 'Pick a course or test series to see who is enrolled.'
              }
            />
          ) : (
            <View style={styles.pickerList}>
              {students.map((student: StudentSummary) => (
                <Pressable
                  key={student.id}
                  style={[styles.pickerRow, studentId === student.id && styles.pickerRowActive]}
                  onPress={() => setStudentId(student.id)}
                >
                  <Ionicons
                    name={studentId === student.id ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={studentId === student.id ? colors.navy : colors.muted}
                  />
                  <View style={styles.studentInfo}>
                    <Text variant="bodyMedium" style={styles.pickerLabel}>{student.name}</Text>
                    {!!student.email && (
                      <Text variant="bodySmall" style={styles.studentEmail}>{student.email}</Text>
                    )}
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        <View style={styles.panel}>
          <Text variant="titleSmall" style={styles.panelTitle}>Goal details</Text>
          <TextInput
            mode="outlined"
            label="Title"
            value={title}
            onChangeText={setTitle}
            style={styles.input}
          />
          <TextInput
            mode="outlined"
            label="Description (optional)"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            style={styles.input}
          />
          <TextInput
            mode="outlined"
            label="Due date (YYYY-MM-DD)"
            value={dueDate}
            onChangeText={setDueDate}
            autoCapitalize="none"
            style={styles.input}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {DUE_PRESETS.map((preset) => {
              const value = format(addDays(new Date(), preset.days), 'yyyy-MM-dd');
              return (
                <Chip
                  key={preset.label}
                  selected={dueDate === value}
                  onPress={() => setDueDate(value)}
                  style={[styles.chip, dueDate === value && styles.chipSelected]}
                  textStyle={dueDate === value ? styles.chipTextSelected : styles.chipText}
                  showSelectedCheck={false}
                >
                  {preset.label}
                </Chip>
              );
            })}
          </ScrollView>
        </View>

        {touched && !!validationError && <HelperText type="error">{validationError}</HelperText>}

        <Button
          mode="contained"
          icon="flag"
          onPress={handleSubmit}
          loading={createMutation.isPending}
          disabled={createMutation.isPending}
          style={styles.button}
        >
          Assign Goal
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
  pickerList: { marginTop: spacing.md, gap: spacing.xs },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    minHeight: 48,
  },
  pickerRowActive: { backgroundColor: colors.blueSoft },
  pickerLabel: { color: colors.text, flex: 1, fontWeight: '600' },
  studentInfo: { flex: 1 },
  studentEmail: { color: colors.muted, marginTop: 2 },
  emptyHint: { color: colors.muted, marginTop: spacing.md, fontStyle: 'italic' },
  loading: { height: 160 },
  input: { marginTop: spacing.sm, backgroundColor: colors.surface },
  chipRow: { gap: spacing.sm, paddingTop: spacing.md, paddingRight: spacing.lg },
  chip: { backgroundColor: colors.faint, borderWidth: 1, borderColor: colors.line },
  chipSelected: { backgroundColor: colors.navy, borderColor: colors.navy },
  chipText: { color: colors.muted, fontWeight: '600' },
  chipTextSelected: { color: colors.surface, fontWeight: '700' },
  button: { borderRadius: radius.sm },
});

export default AssignGoalScreen;
