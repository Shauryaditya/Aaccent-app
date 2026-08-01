import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { courseService } from '../../services/courseService';
import { TeacherStackParamList } from '../../types';
import { handleApiError, showToast } from '../../utils/helpers';

const CreateCourseScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<TeacherStackParamList>>();
  const queryClient = useQueryClient();
  const [title, setTitle] = React.useState('');

  const createMutation = useMutation({
    mutationFn: () => courseService.createCourse({ title: title.trim() }),
    onSuccess: (course) => {
      queryClient.invalidateQueries({ queryKey: ['teacher-courses'] });
      showToast('success', 'Course created');
      navigation.replace('EditCourse', { courseId: course.id });
    },
    onError: (error) => {
      showToast('error', 'Could not create course', handleApiError(error));
    },
  });

  const handleCreate = () => {
    if (!title.trim()) {
      showToast('error', 'Course title required');
      return;
    }

    createMutation.mutate();
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineSmall" style={styles.title}>Create Course</Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        Start with a title. You can add description, chapters, pricing, and publishing details next.
      </Text>

      <TextInput
        mode="outlined"
        label="Course title"
        value={title}
        onChangeText={setTitle}
        autoCapitalize="sentences"
        style={styles.input}
        disabled={createMutation.isPending}
      />

      <Button
        mode="contained"
        icon="plus"
        onPress={handleCreate}
        loading={createMutation.isPending}
        disabled={createMutation.isPending}
        style={styles.button}
      >
        Create Course
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: '#666',
    marginBottom: 24,
    lineHeight: 22,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
});

export default CreateCourseScreen;
