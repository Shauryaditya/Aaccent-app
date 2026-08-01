import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Chip, Text, TextInput } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../../services/api';
import { testService } from '../../services/testService';
import { Category, TeacherStackParamList } from '../../types';
import { handleApiError, showToast } from '../../utils/helpers';
import { colors, radius, spacing } from '../../theme/design';

type NavigationProp = NativeStackNavigationProp<TeacherStackParamList>;

const CreateTestSeriesScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const queryClient = useQueryClient();
  const [title, setTitle] = React.useState('');
  const [categoryId, setCategoryId] = React.useState<string | null>(null);

  const { data: categories = [], isLoading: isLoadingCategories } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => apiService.get('/api/categories'),
  });

  React.useEffect(() => {
    if (!categoryId && categories.length > 0) {
      setCategoryId(categories[0].id);
    }
  }, [categories, categoryId]);

  const createMutation = useMutation({
    mutationFn: () =>
      testService.createTestSeries({
        title: title.trim(),
        categoryId: categoryId || undefined,
      }),
    onSuccess: (series) => {
      queryClient.invalidateQueries({ queryKey: ['teacher-test-series'] });
      queryClient.invalidateQueries({ queryKey: ['test-series'] });
      showToast('success', 'Test series created');
      navigation.replace('EditTestSeries', { testSeriesId: series.id });
    },
    onError: (error) => {
      showToast('error', 'Could not create test series', handleApiError(error));
    },
  });

  const handleCreate = () => {
    if (!title.trim()) {
      showToast('error', 'Test series title required');
      return;
    }

    if (!categoryId) {
      showToast('error', 'Category required');
      return;
    }

    createMutation.mutate();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text variant="headlineSmall" style={styles.title}>Create Test Series</Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        Start with the basics. Chapters, tests, questions, and publishing can be added next.
      </Text>

      <TextInput
        mode="outlined"
        label="Test series title"
        value={title}
        onChangeText={setTitle}
        autoCapitalize="sentences"
        style={styles.input}
        disabled={createMutation.isPending}
      />

      <Text variant="titleSmall" style={styles.label}>Category</Text>
      <View style={styles.categoryWrap}>
        {isLoadingCategories ? (
          <Text variant="bodySmall" style={styles.muted}>Loading categories...</Text>
        ) : categories.length === 0 ? (
          <Text variant="bodySmall" style={styles.muted}>Create a category on the web app first.</Text>
        ) : (
          categories.map((category: Category) => (
            <Chip
              key={category.id}
              selected={categoryId === category.id}
              onPress={() => setCategoryId(category.id)}
              style={[styles.chip, categoryId === category.id && styles.chipSelected]}
              textStyle={[styles.chipText, categoryId === category.id && styles.chipTextSelected]}
            >
              {category.name}
            </Chip>
          ))
        )}
      </View>

      <Button
        mode="contained"
        icon="plus"
        onPress={handleCreate}
        loading={createMutation.isPending}
        disabled={createMutation.isPending || isLoadingCategories}
        style={styles.button}
      >
        Create Test Series
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  title: {
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    color: colors.muted,
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  input: {
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
  },
  label: {
    color: colors.text,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  categoryWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  chip: {
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  chipSelected: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  chipText: {
    color: colors.muted,
  },
  chipTextSelected: {
    color: colors.surface,
  },
  muted: {
    color: colors.muted,
  },
  button: {
    borderRadius: radius.sm,
  },
});

export default CreateTestSeriesScreen;

