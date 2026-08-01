import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Button, SegmentedButtons, Text, TextInput } from 'react-native-paper';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import * as WebBrowser from 'expo-web-browser';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { submissionService } from '../../services/submissionService';
import { uploadThingService } from '../../services/uploadThingService';
import { TeacherStackParamList, TestSubmission } from '../../types';
import { handleApiError, showToast } from '../../utils/helpers';
import { colors, radius, shadow, spacing } from '../../theme/design';

type RouteProps = RouteProp<TeacherStackParamList, 'ReviewSubmission'>;

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

const ReviewSubmissionScreen: React.FC = () => {
  const route = useRoute<RouteProps>();
  const { submissionId } = route.params;
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = React.useState('');
  const [marksAwarded, setMarksAwarded] = React.useState('');
  const [status, setStatus] = React.useState<'REVIEWED' | 'NEEDS_REVISION'>('REVIEWED');
  const [annotatedUrl, setAnnotatedUrl] = React.useState('');
  const [isUploading, setIsUploading] = React.useState(false);

  const { data: submissions = [], isLoading } = useQuery<TestSubmission[]>({
    queryKey: ['all-test-submissions'],
    queryFn: () => submissionService.getAllTestSubmissions(),
  });
  const submission = submissions.find((item: TestSubmission) => item.id === submissionId);

  React.useEffect(() => {
    if (submission) {
      setFeedback(submission.feedback || '');
      setMarksAwarded(submission.marksAwarded !== undefined && submission.marksAwarded !== null ? String(submission.marksAwarded) : '');
      setAnnotatedUrl(submission.annotatedPdfUrl || '');
      setStatus(submission.status === 'NEEDS_REVISION' ? 'NEEDS_REVISION' : 'REVIEWED');
    }
  }, [submission]);

  const reviewMutation = useMutation({
    mutationFn: () => submissionService.reviewTestSubmission(submissionId, {
      status,
      feedback: feedback.trim() || undefined,
      marksAwarded: marksAwarded.trim() ? Number(marksAwarded) : undefined,
      annotatedPdfUrl: annotatedUrl || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-test-submissions'] });
      showToast('success', 'Review returned');
    },
    onError: (error) => showToast('error', 'Could not submit review', handleApiError(error)),
  });

  const pickAnnotatedFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    if (!asset.size) { showToast('error', 'Could not read file size'); return; }

    try {
      setIsUploading(true);
      const uploaded = await uploadThingService.uploadFile('testSubmission', {
        uri: asset.uri,
        name: asset.name || 'Annotated submission',
        type: asset.mimeType || 'application/octet-stream',
        size: asset.size,
      });
      setAnnotatedUrl(uploaded.url);
      showToast('success', 'Annotated file uploaded');
    } catch (error) {
      showToast('error', 'Upload failed', handleApiError(error));
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading || !submission) return <LoadingSpinner message="Loading submission..." />;

  const answerUrls = parseStoredUrls(submission.pdfUrl);
  const returnedUrls = parseStoredUrls(annotatedUrl);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text variant="headlineSmall" style={styles.title}>Review Submission</Text>
      <View style={styles.panel}>
        <Text variant="titleMedium" style={styles.sectionTitle}>{submission.testChapter?.title || 'Test Chapter'}</Text>
        <View style={styles.linkRow}>{answerUrls.map((url, index) => <Pressable key={url} onPress={() => WebBrowser.openBrowserAsync(url)}><Text style={styles.link}>Open answer {index + 1}</Text></Pressable>)}</View>
      </View>

      <View style={styles.panel}>
        <SegmentedButtons value={status} onValueChange={(value) => setStatus(value as 'REVIEWED' | 'NEEDS_REVISION')} buttons={[{ value: 'REVIEWED', label: 'Reviewed' }, { value: 'NEEDS_REVISION', label: 'Revision' }]} />
        <TextInput mode="outlined" label="Marks awarded" value={marksAwarded} onChangeText={setMarksAwarded} keyboardType="numeric" style={styles.input} />
        <TextInput mode="outlined" label="Feedback" value={feedback} onChangeText={setFeedback} multiline numberOfLines={5} style={styles.input} />
        <Button mode="contained" icon="upload" onPress={pickAnnotatedFile} loading={isUploading} disabled={isUploading} style={styles.button}>Upload Annotated File</Button>
        {returnedUrls.length > 0 && <View style={styles.linkRow}>{returnedUrls.map((url, index) => <Pressable key={url} onPress={() => WebBrowser.openBrowserAsync(url)}><Text style={styles.reviewLink}>Returned file {index + 1}</Text></Pressable>)}</View>}
        <Button mode="contained" icon="send" onPress={() => reviewMutation.mutate()} loading={reviewMutation.isPending} disabled={reviewMutation.isPending} style={styles.button}>Return To Student</Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  title: { color: colors.text, fontWeight: '800', marginBottom: spacing.lg },
  panel: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: spacing.lg, marginBottom: spacing.lg, ...shadow.card },
  sectionTitle: { color: colors.text, fontWeight: '800', marginBottom: spacing.md },
  input: { marginTop: spacing.md, backgroundColor: colors.surface },
  button: { borderRadius: radius.sm, marginTop: spacing.md },
  linkRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  link: { color: colors.blue, fontWeight: '800' },
  reviewLink: { color: colors.success, fontWeight: '800' },
});

export default ReviewSubmissionScreen;

