import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { courseService } from '../../services/courseService';
import { TeacherStackParamList } from '../../types';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { handleApiError, showToast } from '../../utils/helpers';

type RouteProps = RouteProp<TeacherStackParamList, 'EditCourse'>;

const EditCourseScreen: React.FC = () => {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NativeStackNavigationProp<TeacherStackParamList>>();
  const queryClient = useQueryClient();
  const { courseId } = route.params;
  const [title, setTitle] = React.useState('');

  const { data: course, isLoading } = useQuery({
    queryKey: ['teacher-course', courseId],
    queryFn: () => courseService.getCourseById(courseId),
  });

  React.useEffect(() => {
    if (course) {
      setTitle(course.title);
    }
  }, [course]);

  const updateMutation = useMutation({
    mutationFn: () => courseService.updateCourse(courseId, { title: title.trim() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-course', courseId] });
      queryClient.invalidateQueries({ queryKey: ['teacher-courses'] });
      showToast('success', 'Course updated');
    },
    onError: (error) => {
      showToast('error', 'Could not update course', handleApiError(error));
    },
  });

  if (isLoading || !course) {
    return <LoadingSpinner message="Loading course..." />;
  }

  const handleSave = () => {
    if (!title.trim()) {
      showToast('error', 'Course title required');
      return;
    }
    updateMutation.mutate();
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineSmall" style={styles.title}>Edit Course</Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        Basic mobile editing is enabled. Full course builder sections can be added next.
      </Text>

      <TextInput
        mode="outlined"
        label="Course title"
        value={title}
        onChangeText={setTitle}
        style={styles.input}
        disabled={updateMutation.isPending}
      />

      <Button
        mode="contained"
        icon="content-save"
        onPress={handleSave}
        loading={updateMutation.isPending}
        disabled={updateMutation.isPending}
        style={styles.button}
      >
        Save Changes
      </Button>

      <Button
        mode="outlined"
        icon="format-list-bulleted"
        onPress={() => navigation.navigate('ManageChapters', { courseId })}
        style={styles.button}
      >
        Manage Chapters
      </Button>

      <Text variant="bodySmall" style={styles.meta}>
        Status: {course.isPublished ? 'Published' : 'Draft'}
      </Text>
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
  meta: {
    color: '#666',
    marginTop: 24,
  },
});

export default EditCourseScreen;
