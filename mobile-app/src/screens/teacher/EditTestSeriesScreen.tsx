import React from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Button, IconButton, Switch, Text, TextInput } from 'react-native-paper';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import * as WebBrowser from 'expo-web-browser';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { testService } from '../../services/testService';
import { uploadThingService } from '../../services/uploadThingService';
import { Attachment, TeacherStackParamList, TestChapter, TestSeries } from '../../types';
import { handleApiError, showToast } from '../../utils/helpers';
import { colors, radius, shadow, spacing } from '../../theme/design';

type RouteProps = RouteProp<TeacherStackParamList, 'EditTestSeries'>;
type NavigationProp = NativeStackNavigationProp<TeacherStackParamList>;

const QUESTION_PAPER_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const EditTestSeriesScreen: React.FC = () => {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const queryClient = useQueryClient();
  const { testSeriesId } = route.params;
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [price, setPrice] = React.useState('');
  const [isPublished, setIsPublished] = React.useState(false);
  const [selectedChapterId, setSelectedChapterId] = React.useState<string | null>(null);
  const [chapterTitle, setChapterTitle] = React.useState('');
  const [chapterDescription, setChapterDescription] = React.useState('');
  const [chapterPublished, setChapterPublished] = React.useState(false);
  const [isUploadingAttachment, setIsUploadingAttachment] = React.useState(false);

  const { data: series, isLoading, isFetching, refetch } = useQuery<TestSeries>({
    queryKey: ['teacher-test-series-detail', testSeriesId],
    queryFn: () => testService.getTestSeriesById(testSeriesId),
  });

  const chapters = series?.testChapters || [];
  const selectedChapter = chapters.find((chapter: TestChapter) => chapter.id === selectedChapterId) || null;

  React.useEffect(() => {
    if (series) {
      setTitle(series.title || '');
      setDescription(series.description || '');
      setPrice(series.price !== undefined && series.price !== null ? String(series.price) : '');
      setIsPublished(!!series.isPublished);
      if (!selectedChapterId && series.testChapters?.length) {
        setSelectedChapterId(series.testChapters[0].id);
      }
    }
  }, [series, selectedChapterId]);

  React.useEffect(() => {
    if (selectedChapter) {
      setChapterTitle(selectedChapter.title || '');
      setChapterDescription(selectedChapter.description || '');
      setChapterPublished(!!selectedChapter.isPublished);
    }
  }, [selectedChapter]);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['teacher-test-series-detail', testSeriesId] });
    queryClient.invalidateQueries({ queryKey: ['teacher-test-series'] });
    queryClient.invalidateQueries({ queryKey: ['test-series'] });
  };

  const updateSeriesMutation = useMutation({
    mutationFn: () => testService.updateTestSeries(testSeriesId, {
      title: title.trim(),
      description: description.trim() || undefined,
      price: price.trim() ? Number(price) : undefined,
      isPublished,
    }),
    onSuccess: () => { refresh(); showToast('success', 'Test series saved'); },
    onError: (error) => showToast('error', 'Could not save test series', handleApiError(error)),
  });

  const createChapterMutation = useMutation({
    mutationFn: () => testService.createTestChapter(testSeriesId, { title: 'Untitled test chapter' }),
    onSuccess: (chapter) => { refresh(); setSelectedChapterId(chapter.id); showToast('success', 'Chapter created'); },
    onError: (error) => showToast('error', 'Could not create chapter', handleApiError(error)),
  });

  const updateChapterMutation = useMutation({
    mutationFn: () => {
      if (!selectedChapterId) throw new Error('No chapter selected');
      return testService.updateTestChapter(testSeriesId, selectedChapterId, {
        title: chapterTitle.trim(),
        description: chapterDescription.trim() || undefined,
        isPublished: chapterPublished,
      });
    },
    onSuccess: () => { refresh(); showToast('success', 'Chapter saved'); },
    onError: (error) => showToast('error', 'Could not save chapter', handleApiError(error)),
  });

  const deleteChapterMutation = useMutation({
    mutationFn: (testChapterId: string) => testService.deleteTestChapter(testSeriesId, testChapterId),
    onSuccess: () => { refresh(); setSelectedChapterId(null); showToast('success', 'Chapter deleted'); },
    onError: (error) => showToast('error', 'Could not delete chapter', handleApiError(error)),
  });

  const deleteAttachmentMutation = useMutation({
    mutationFn: ({ testChapterId, attachmentId }: { testChapterId: string; attachmentId: string }) =>
      testService.deleteTestChapterAttachment(testSeriesId, testChapterId, attachmentId),
    onSuccess: () => { refresh(); showToast('success', 'Question paper deleted'); },
    onError: (error) => showToast('error', 'Could not delete question paper', handleApiError(error)),
  });

  const handleSaveSeries = () => {
    if (!title.trim()) { showToast('error', 'Title required'); return; }
    updateSeriesMutation.mutate();
  };

  const handleSaveChapter = () => {
    if (!selectedChapterId) return;
    if (!chapterTitle.trim()) { showToast('error', 'Chapter title required'); return; }
    updateChapterMutation.mutate();
  };

  const handleUploadQuestionPaper = async () => {
    if (!selectedChapterId) {
      showToast('error', 'Select a chapter first');
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: QUESTION_PAPER_TYPES,
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || !result.assets?.[0]) {
        return;
      }

      const asset = result.assets[0];
      if (!asset.size) {
        showToast('error', 'Could not read file size');
        return;
      }

      setIsUploadingAttachment(true);
      const uploaded = await uploadThingService.uploadFile('testChapterAttachment', {
        uri: asset.uri,
        name: asset.name || 'Question paper',
        type: asset.mimeType || 'application/octet-stream',
        size: asset.size,
      });

      await testService.addTestChapterAttachment(testSeriesId, selectedChapterId, {
        name: uploaded.name,
        url: uploaded.url,
      });
      refresh();
      showToast('success', 'Question paper uploaded');
    } catch (error) {
      showToast('error', 'Upload failed', handleApiError(error));
    } finally {
      setIsUploadingAttachment(false);
    }
  };

  const openUrl = async (url: string) => {
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch (error) {
      showToast('error', 'Could not open question paper');
    }
  };

  const confirmDeleteChapter = (chapter: TestChapter) => {
    Alert.alert('Delete chapter?', chapter.title, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteChapterMutation.mutate(chapter.id) },
    ]);
  };

  const confirmDeleteAttachment = (attachment: Attachment) => {
    if (!selectedChapterId) return;
    Alert.alert('Delete question paper?', attachment.name || 'Attachment', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteAttachmentMutation.mutate({ testChapterId: selectedChapterId, attachmentId: attachment.id }) },
    ]);
  };

  if (isLoading || !series) return <LoadingSpinner message="Loading test series..." />;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
    >
      <Text variant="headlineSmall" style={styles.title}>Edit Test Series</Text>
      <View style={styles.panel}>
        <TextInput mode="outlined" label="Title" value={title} onChangeText={setTitle} style={styles.input} />
        <TextInput mode="outlined" label="Description" value={description} onChangeText={setDescription} multiline numberOfLines={4} style={styles.input} />
        <TextInput mode="outlined" label="Price" value={price} onChangeText={setPrice} keyboardType="numeric" style={styles.input} />
        <View style={styles.toggleRow}>
          <View>
            <Text variant="bodyMedium" style={styles.toggleTitle}>Published</Text>
            <Text variant="bodySmall" style={styles.toggleMeta}>Visible to students when chapters are published.</Text>
          </View>
          <Switch value={isPublished} onValueChange={setIsPublished} />
        </View>
        <Button mode="contained" icon="content-save" onPress={handleSaveSeries} loading={updateSeriesMutation.isPending} style={styles.button}>Save Test Series</Button>
      </View>

      <View style={styles.sectionHeader}>
        <View>
          <Text variant="titleLarge" style={styles.sectionTitle}>Test Series Chapters</Text>
          <Text variant="bodySmall" style={styles.muted}>{chapters.length} chapters</Text>
        </View>
        <Button mode="contained" icon="plus" onPress={() => createChapterMutation.mutate()} loading={createChapterMutation.isPending}>Add</Button>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chapterTabs}>
        {chapters.map((chapter: TestChapter) => (
          <Pressable key={chapter.id} style={[styles.chapterTab, selectedChapterId === chapter.id && styles.chapterTabSelected]} onPress={() => setSelectedChapterId(chapter.id)}>
            <Text variant="labelMedium" numberOfLines={1} style={[styles.chapterTabText, selectedChapterId === chapter.id && styles.chapterTabTextSelected]}>{chapter.position}. {chapter.title}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {selectedChapter && (
        <View style={styles.panel}>
          <View style={styles.editorHeader}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Chapter Details</Text>
            <IconButton icon="delete-outline" iconColor="#dc2626" onPress={() => confirmDeleteChapter(selectedChapter)} />
          </View>
          <TextInput mode="outlined" label="Chapter title" value={chapterTitle} onChangeText={setChapterTitle} style={styles.input} />
          <TextInput mode="outlined" label="Chapter description" value={chapterDescription} onChangeText={setChapterDescription} multiline numberOfLines={4} style={styles.input} />
          <View style={styles.toggleRow}>
            <View>
              <Text variant="bodyMedium" style={styles.toggleTitle}>Published</Text>
              <Text variant="bodySmall" style={styles.toggleMeta}>Students can see the paper and submit answers to this chapter.</Text>
            </View>
            <Switch value={chapterPublished} onValueChange={setChapterPublished} />
          </View>
          <Button mode="contained" icon="content-save" onPress={handleSaveChapter} loading={updateChapterMutation.isPending} style={styles.button}>Save Chapter</Button>

          <View style={styles.attachmentsPanel}>
            <View style={styles.questionHeader}>
              <View>
                <Text variant="titleMedium" style={styles.sectionTitle}>Question Papers</Text>
                <Text variant="bodySmall" style={styles.muted}>Upload PDF, DOC, or DOCX for subjective exams.</Text>
              </View>
              <Button mode="contained-tonal" icon="file-upload-outline" compact onPress={handleUploadQuestionPaper} loading={isUploadingAttachment} disabled={isUploadingAttachment}>
                Upload
              </Button>
            </View>

            {(selectedChapter.attachments || []).length === 0 ? (
              <Text variant="bodySmall" style={styles.emptyAttachment}>No question paper attached yet.</Text>
            ) : (
              (selectedChapter.attachments || []).map((attachment: Attachment) => (
                <View key={attachment.id} style={styles.attachmentRow}>
                  <Pressable style={styles.attachmentBody} onPress={() => openUrl(attachment.url)}>
                    <Text variant="bodyMedium" style={styles.attachmentName} numberOfLines={1}>{attachment.name || 'Question paper'}</Text>
                    <Text variant="bodySmall" style={styles.attachmentMeta} numberOfLines={1}>{attachment.url}</Text>
                  </Pressable>
                  <IconButton icon="open-in-new" size={20} onPress={() => openUrl(attachment.url)} />
                  <IconButton icon="delete-outline" size={20} iconColor="#dc2626" onPress={() => confirmDeleteAttachment(attachment)} />
                </View>
              ))
            )}
          </View>

          <Button mode="outlined" icon="clipboard-list-outline" onPress={() => navigation.navigate('ManageTests', { testSeriesId })} style={styles.button}>Manage Objective Tests</Button>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  title: { color: colors.text, fontWeight: '800', marginBottom: spacing.lg },
  panel: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: spacing.lg, marginBottom: spacing.xl, ...shadow.card },
  input: { marginBottom: spacing.md, backgroundColor: colors.surface },
  toggleRow: { minHeight: 62, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: colors.line, marginBottom: spacing.md },
  toggleTitle: { color: colors.text, fontWeight: '700' },
  toggleMeta: { color: colors.muted, marginTop: 2, maxWidth: 230 },
  button: { borderRadius: radius.sm, marginTop: spacing.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  sectionTitle: { color: colors.text, fontWeight: '800' },
  muted: { color: colors.muted, marginTop: 2 },
  chapterTabs: { marginHorizontal: -spacing.lg, marginBottom: spacing.lg },
  chapterTab: { maxWidth: 190, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginLeft: spacing.lg, borderRadius: radius.sm, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  chapterTabSelected: { backgroundColor: colors.navy, borderColor: colors.navy },
  chapterTabText: { color: colors.muted, fontWeight: '700' },
  chapterTabTextSelected: { color: colors.surface },
  editorHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  attachmentsPanel: { marginTop: spacing.lg, paddingTop: spacing.lg, borderTopWidth: 1, borderTopColor: colors.line },
  questionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, marginBottom: spacing.md },
  emptyAttachment: { color: colors.muted, paddingVertical: spacing.sm },
  attachmentRow: { minHeight: 64, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, paddingLeft: spacing.md, marginBottom: spacing.sm, backgroundColor: '#fff' },
  attachmentBody: { flex: 1, paddingVertical: spacing.sm },
  attachmentName: { color: colors.text, fontWeight: '700' },
  attachmentMeta: { color: colors.muted, marginTop: 2 },
});

export default EditTestSeriesScreen;
