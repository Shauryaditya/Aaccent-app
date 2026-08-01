import React from 'react';
import { Image, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import * as WebBrowser from 'expo-web-browser';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { submissionService } from '../../services/submissionService';
import { uploadThingService } from '../../services/uploadThingService';
import { StudentStackParamList, TestSubmission } from '../../types';
import { handleApiError, showToast } from '../../utils/helpers';
import { colors, radius, shadow, spacing } from '../../theme/design';

type RouteProps = RouteProp<StudentStackParamList, 'SubmitAssignment'>;

type LocalImage = { uri: string; name: string; type: string; size: number };

const parseStoredUrls = (value?: string | null) => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed.urls)) return parsed.urls as string[];
  } catch (error) {
    return [value];
  }
  return [value];
};

const SubmitAssignmentScreen: React.FC = () => {
  const route = useRoute<RouteProps>();
  const queryClient = useQueryClient();
  const { testChapterId } = route.params;
  const [images, setImages] = React.useState<LocalImage[]>([]);
  const [isUploading, setIsUploading] = React.useState(false);

  const { data: submissions = [], isLoading, isFetching, refetch } = useQuery<TestSubmission[]>({
    queryKey: ['test-submissions', testChapterId],
    queryFn: () => submissionService.getTestSubmissions(testChapterId),
    enabled: !!testChapterId,
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!testChapterId) throw new Error('Missing test chapter');
      setIsUploading(true);
      const uploadedUrls: string[] = [];
      let totalSize = 0;

      for (const image of images) {
        totalSize += image.size;
        const uploaded = await uploadThingService.uploadFile('testSubmission', image);
        uploadedUrls.push(uploaded.url);
      }

      return submissionService.submitTestAssignment(testChapterId, {
        imageUrls: uploadedUrls,
        fileName: `${images.length} photos`,
        fileSize: totalSize,
      });
    },
    onSuccess: () => {
      setImages([]);
      queryClient.invalidateQueries({ queryKey: ['test-submissions', testChapterId] });
      showToast('success', 'Submission sent');
    },
    onError: (error) => showToast('error', 'Submission failed', handleApiError(error)),
    onSettled: () => setIsUploading(false),
  });

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.85,
    });

    if (result.canceled) return;

    const selected = result.assets.map((asset, index) => ({
      uri: asset.uri,
      name: asset.fileName || `submission-${Date.now()}-${index}.jpg`,
      type: asset.mimeType || 'image/jpeg',
      size: asset.fileSize || 1,
    }));

    setImages((current) => [...current, ...selected]);
  };

  const openUrl = async (url: string) => WebBrowser.openBrowserAsync(url);

  if (isLoading) return <LoadingSpinner message="Loading submissions..." />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}>
      <Text variant="headlineSmall" style={styles.title}>Submit Answer Photos</Text>
      <Text variant="bodyMedium" style={styles.subtitle}>Upload clear photos of every answer page. Your teacher can return annotated files here.</Text>

      <Button mode="contained" icon="image-plus" onPress={pickImages} style={styles.button}>Pick Photos</Button>
      {images.length > 0 && (
        <View style={styles.previewGrid}>
          {images.map((image, index) => <Image key={`${image.uri}-${index}`} source={{ uri: image.uri }} style={styles.preview} />)}
        </View>
      )}
      <Button mode="contained" icon="cloud-upload" onPress={() => submitMutation.mutate()} loading={isUploading || submitMutation.isPending} disabled={images.length === 0 || isUploading || submitMutation.isPending} style={styles.button}>Upload & Submit</Button>

      <Text variant="titleMedium" style={styles.sectionTitle}>Previous Submissions</Text>
      {submissions.map((submission: TestSubmission) => {
        const answerUrls = parseStoredUrls(submission.pdfUrl);
        const annotatedUrls = parseStoredUrls(submission.annotatedPdfUrl);
        return (
          <View key={submission.id} style={styles.card}>
            <Text variant="titleSmall" style={styles.cardTitle}>Attempt {submission.attemptNo} · {submission.status}</Text>
            {!!submission.feedback && <Text variant="bodySmall" style={styles.feedback}>{submission.feedback}</Text>}
            <View style={styles.linkRow}>{answerUrls.map((url, index) => <Pressable key={url} onPress={() => openUrl(url)}><Text style={styles.link}>Answer {index + 1}</Text></Pressable>)}</View>
            {annotatedUrls.length > 0 && <View style={styles.linkRow}>{annotatedUrls.map((url, index) => <Pressable key={url} onPress={() => openUrl(url)}><Text style={styles.reviewLink}>Annotated {index + 1}</Text></Pressable>)}</View>}
          </View>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  title: { color: colors.text, fontWeight: '800', marginBottom: spacing.sm },
  subtitle: { color: colors.muted, lineHeight: 22, marginBottom: spacing.lg },
  button: { borderRadius: radius.sm, marginBottom: spacing.md },
  previewGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  preview: { width: 92, height: 120, borderRadius: radius.sm, backgroundColor: colors.line },
  sectionTitle: { color: colors.text, fontWeight: '800', marginTop: spacing.lg, marginBottom: spacing.md },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: spacing.md, marginBottom: spacing.md, ...shadow.card },
  cardTitle: { color: colors.text, fontWeight: '800' },
  feedback: { color: colors.muted, marginTop: spacing.sm },
  linkRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  link: { color: colors.blue, fontWeight: '700' },
  reviewLink: { color: colors.success, fontWeight: '800' },
});

export default SubmitAssignmentScreen;

