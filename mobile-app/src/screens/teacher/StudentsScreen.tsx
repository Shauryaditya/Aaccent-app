import React from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Avatar, Searchbar, Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { studentService } from '../../services/studentService';
import { StudentSummary, TeacherStackParamList } from '../../types';
import { colors, radius, shadow, spacing } from '../../theme/design';

type NavigationProp = NativeStackNavigationProp<TeacherStackParamList>;

const initialsOf = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'S';

const StudentsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [search, setSearch] = React.useState('');

  const {
    data: students = [],
    isLoading,
    isFetching,
    refetch,
  } = useQuery<StudentSummary[]>({
    queryKey: ['teacher-students'],
    queryFn: () => studentService.getStudents(),
  });

  const filtered = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return students;
    return students.filter(
      (student) =>
        student.name.toLowerCase().includes(term) || student.email.toLowerCase().includes(term)
    );
  }, [students, search]);

  if (isLoading) return <LoadingSpinner message="Loading students..." />;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
    >
      <Text variant="headlineSmall" style={styles.title}>Your Students</Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        Everyone enrolled in one of your courses or test series.
      </Text>

      {students.length > 0 && (
        <Searchbar
          placeholder="Search by name or email"
          value={search}
          onChangeText={setSearch}
          style={styles.search}
          inputStyle={styles.searchInput}
        />
      )}

      {students.length === 0 ? (
        <EmptyState
          icon="people-outline"
          title="No students yet"
          message="Students appear here once they enrol in one of your courses or test series."
        />
      ) : filtered.length === 0 ? (
        <EmptyState icon="search-outline" title="No matches" message="Try a different search term." />
      ) : (
        filtered.map((student) => (
          <Pressable
            key={student.id}
            style={styles.card}
            onPress={() => navigation.navigate('StudentProgress', { studentId: student.id })}
          >
            {student.imageUrl ? (
              <Avatar.Image size={44} source={{ uri: student.imageUrl }} style={styles.avatar} />
            ) : (
              <Avatar.Text size={44} label={initialsOf(student.name)} style={styles.avatar} />
            )}
            <View style={styles.cardBody}>
              <Text variant="titleSmall" style={styles.cardTitle}>{student.name}</Text>
              <Text variant="bodySmall" style={styles.cardMeta}>
                {[student.email, student.grade].filter(Boolean).join(' · ') || 'Enrolled student'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.muted} />
          </Pressable>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  title: { color: colors.text, fontWeight: '800', marginBottom: spacing.xs },
  subtitle: { color: colors.muted, lineHeight: 22, marginBottom: spacing.lg },
  search: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: spacing.lg,
  },
  searchInput: { minHeight: 44 },
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
  avatar: { marginRight: spacing.md, backgroundColor: colors.blueSoft },
  cardBody: { flex: 1 },
  cardTitle: { color: colors.text, fontWeight: '800' },
  cardMeta: { color: colors.muted, marginTop: 4 },
});

export default StudentsScreen;
