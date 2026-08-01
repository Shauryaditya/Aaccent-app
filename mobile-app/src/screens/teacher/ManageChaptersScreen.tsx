import React from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Button, IconButton, Switch, Text, TextInput } from 'react-native-paper';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as WebBrowser from 'expo-web-browser';
import * as DocumentPicker from 'expo-document-picker';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { courseService } from '../../services/courseService';
import { uploadThingService } from '../../services/uploadThingService';
import { Attachment, Chapter, TeacherStackParamList } from '../../types';
import { handleApiError, showToast } from '../../utils/helpers';
import { colors, radius, shadow, spacing } from '../../theme/design';

type RouteProps = RouteProp<TeacherStackParamList, 'ManageChapters'>;

type ChapterForm = {
  title: string;
  description: string;
  videoUrl: string;
  isFree: boolean;
  isPublished: boolean;
};

const emptyForm: ChapterForm = {
  title: '',
  description: '',
  videoUrl: '',
  isFree: false,
  isPublished: false,
};

const ManageChaptersScreen: React.FC = () => {
  const route = useRoute<RouteProps>();
  const { courseId } = route.params;
  const queryClient = useQueryClient();
  const [selectedChapterId, setSelectedChapterId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<ChapterForm>(emptyForm);
  const [attachmentName, setAttachmentName] = React.useState('');
  const [attachmentUrl, setAttachmentUrl] = React.useState('');
  const [isUploadingAttachment, setIsUploadingAttachment] = React.useState(false);

  const {
    data: chapters = [],
    isLoading,
    isFetching,
    refetch,
  } = useQuery<Chapter[]>({
    queryKey: ['teacher-chapters', courseId],
    queryFn: () => courseService.getChapters(courseId),
  });

  const selectedChapter = React.useMemo(
    () => chapters.find((chapter: Chapter) => chapter.id === selectedChapterId) || null,
    [chapters, selectedChapterId]
  );

  React.useEffect(() => {
    if (!selectedChapterId && chapters.length > 0) {
      setSelectedChapterId(chapters[0].id);
    }
  }, [chapters, selectedChapterId]);

  React.useEffect(() => {
    if (selectedChapter) {
      setForm({
        title: selectedChapter.title || '',
        description: selectedChapter.description || '',
        videoUrl: selectedChapter.videoUrl || '',
        isFree: !!selectedChapter.isFree,
        isPublished: !!selectedChapter.isPublished,
      });
      setAttachmentName('');
      setAttachmentUrl('');
    }
  }, [selectedChapter]);

  const refreshCourse = () => {
    queryClient.invalidateQueries({ queryKey: ['teacher-chapters', courseId] });
    queryClient.invalidateQueries({ queryKey: ['teacher-course', courseId] });
    queryClient.invalidateQueries({ queryKey: ['course', courseId] });
  };

  const createMutation = useMutation({
    mutationFn: () => courseService.createChapter(courseId, { title: 'Untitled chapter' }),
    onSuccess: (chapter) => {
      refreshCourse();
      setSelectedChapterId(chapter.id);
      showToast('success', 'Chapter created');
    },
    onError: (error) => showToast('error', 'Could not create chapter', handleApiError(error)),
  });

  const updateMutation = useMutation({
    mutationFn: () => {
      if (!selectedChapterId) throw new Error('No chapter selected');
      return courseService.updateChapter(courseId, selectedChapterId, {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        videoUrl: form.videoUrl.trim() || undefined,
        isFree: form.isFree,
        isPublished: form.isPublished,
      });
    },
    onSuccess: () => {
      refreshCourse();
      showToast('success', 'Chapter saved');
    },
    onError: (error) => showToast('error', 'Could not save chapter', handleApiError(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: (chapterId: string) => courseService.deleteChapter(courseId, chapterId),
    onSuccess: () => {
      refreshCourse();
      setSelectedChapterId(null);
      showToast('success', 'Chapter deleted');
    },
    onError: (error) => showToast('error', 'Could not delete chapter', handleApiError(error)),
  });

  const addAttachmentMutation = useMutation({
    mutationFn: () => {
      if (!selectedChapterId) throw new Error('No chapter selected');
      return courseService.addChapterAttachment(courseId, selectedChapterId, {
        name: attachmentName.trim() || undefined,
        url: attachmentUrl.trim(),
      });
    },
    onSuccess: () => {
      refreshCourse();
      setAttachmentName('');
      setAttachmentUrl('');
      showToast('success', 'Attachment added');
    },
    onError: (error) => showToast('error', 'Could not add attachment', handleApiError(error)),
  });

  const deleteAttachmentMutation = useMutation({
    mutationFn: ({ chapterId, attachmentId }: { chapterId: string; attachmentId: string }) =>
      courseService.deleteChapterAttachment(courseId, chapterId, attachmentId),
    onSuccess: () => {
      refreshCourse();
      showToast('success', 'Attachment deleted');
    },
    onError: (error) => showToast('error', 'Could not delete attachment', handleApiError(error)),
  });

  const handleSave = () => {
    if (!selectedChapterId) return;
    if (!form.title.trim()) {
      showToast('error', 'Chapter title required');
      return;
    }
    updateMutation.mutate();
  };

  const handleAddAttachment = () => {
    if (!attachmentUrl.trim()) {
      showToast('error', 'Attachment URL required');
      return;
    }
    addAttachmentMutation.mutate();
  };

  const handlePickAndUploadAttachment = async () => {
    if (!selectedChapterId) {
      showToast('error', 'Select a chapter first');
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*', 'text/*', 'audio/*', 'video/*'],
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
      const uploaded = await uploadThingService.uploadFile('courseAttachment', {
        uri: asset.uri,
        name: asset.name || 'Attachment',
        type: asset.mimeType || 'application/octet-stream',
        size: asset.size,
      });

      await courseService.addChapterAttachment(courseId, selectedChapterId, {
        name: uploaded.name,
        url: uploaded.url,
      });

      refreshCourse();
      showToast('success', 'Attachment uploaded');
    } catch (error) {
      showToast('error', 'Upload failed', handleApiError(error));
    } finally {
      setIsUploadingAttachment(false);
    }
  };

  const confirmDeleteChapter = (chapter: Chapter) => {
    Alert.alert('Delete chapter?', chapter.title, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(chapter.id) },
    ]);
  };

  const openUrl = async (url: string) => {
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch (error) {
      showToast('error', 'Could not open attachment');
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading chapters..." />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
    >
      <View style={styles.header}>
        <View>
          <Text variant="headlineSmall" style={styles.title}>Manage Chapters</Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            {chapters.length} {chapters.length === 1 ? 'chapter' : 'chapters'} in this course
          </Text>
        </View>
        <Button mode="contained" icon="plus" onPress={() => createMutation.mutate()} loading={createMutation.isPending}>
          Add
        </Button>
      </View>

      {chapters.length === 0 ? (
        <EmptyState
          icon="list-outline"
          title="No chapters yet"
          message="Create your first chapter and then add content, video, and attachments."
          actionLabel="Add Chapter"
          onAction={() => createMutation.mutate()}
        />
      ) : (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chapterTabs}>
            {chapters.map((chapter: Chapter) => (
              <Pressable
                key={chapter.id}
                style={[styles.chapterTab, selectedChapterId === chapter.id && styles.chapterTabSelected]}
                onPress={() => setSelectedChapterId(chapter.id)}
              >
                <Text
                  variant="labelMedium"
                  style={[styles.chapterTabText, selectedChapterId === chapter.id && styles.chapterTabTextSelected]}
                  numberOfLines={1}
                >
                  {chapter.position}. {chapter.title}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {selectedChapter && (
            <View style={styles.editor}>
              <View style={styles.editorHeader}>
                <Text variant="titleMedium" style={styles.sectionTitle}>Chapter Details</Text>
                <IconButton icon="delete-outline" iconColor="#dc2626" onPress={() => confirmDeleteChapter(selectedChapter)} />
              </View>

              <TextInput
                mode="outlined"
                label="Title"
                value={form.title}
                onChangeText={(title) => setForm((current) => ({ ...current, title }))}
                style={styles.input}
              />

              <TextInput
                mode="outlined"
                label="Description"
                value={form.description}
                onChangeText={(description) => setForm((current) => ({ ...current, description }))}
                multiline
                numberOfLines={5}
                style={styles.input}
              />

              <TextInput
                mode="outlined"
                label="YouTube or video URL"
                value={form.videoUrl}
                onChangeText={(videoUrl) => setForm((current) => ({ ...current, videoUrl }))}
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
              />

              <View style={styles.toggleRow}>
                <View>
                  <Text variant="bodyMedium" style={styles.toggleTitle}>Preview chapter</Text>
                  <Text variant="bodySmall" style={styles.toggleMeta}>Free students can open this chapter.</Text>
                </View>
                <Switch value={form.isFree} onValueChange={(isFree) => setForm((current) => ({ ...current, isFree }))} />
              </View>

              <View style={styles.toggleRow}>
                <View>
                  <Text variant="bodyMedium" style={styles.toggleTitle}>Published</Text>
                  <Text variant="bodySmall" style={styles.toggleMeta}>Visible inside the course.</Text>
                </View>
                <Switch value={form.isPublished} onValueChange={(isPublished) => setForm((current) => ({ ...current, isPublished }))} />
              </View>

              <Button
                mode="contained"
                icon="content-save"
                onPress={handleSave}
                loading={updateMutation.isPending}
                disabled={updateMutation.isPending}
                style={styles.saveButton}
              >
                Save Chapter
              </Button>

              <View style={styles.attachmentsPanel}>
                <Text variant="titleMedium" style={styles.sectionTitle}>Attachments</Text>
                {(selectedChapter.attachments || []).map((attachment: Attachment) => (
                  <View key={attachment.id} style={styles.attachmentRow}>
                    <Pressable style={styles.attachmentBody} onPress={() => openUrl(attachment.url)}>
                      <Text variant="bodyMedium" style={styles.attachmentName} numberOfLines={1}>
                        {attachment.name || 'Attachment'}
                      </Text>
                      <Text variant="bodySmall" style={styles.attachmentMeta} numberOfLines={1}>
                        {attachment.url}
                      </Text>
                    </Pressable>
                    <IconButton
                      icon="delete-outline"
                      iconColor="#dc2626"
                      size={20}
                      onPress={() => deleteAttachmentMutation.mutate({ chapterId: selectedChapter.id, attachmentId: attachment.id })}
                    />
                  </View>
                ))}

                <Button
                  mode="contained"
                  icon="upload"
                  onPress={handlePickAndUploadAttachment}
                  loading={isUploadingAttachment}
                  disabled={isUploadingAttachment}
                  style={styles.saveButton}
                >
                  Pick & Upload PDF/File
                </Button>

                <Text variant="bodySmall" style={styles.fallbackLabel}>Already have a file URL?</Text>
                <TextInput
                  mode="outlined"
                  label="Attachment name"
                  value={attachmentName}
                  onChangeText={setAttachmentName}
                  style={styles.input}
                />
                <TextInput
                  mode="outlined"
                  label="PDF or file URL"
                  value={attachmentUrl}
                  onChangeText={setAttachmentUrl}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={styles.input}
                />
                <Button
                  mode="outlined"
                  icon="link-plus"
                  onPress={handleAddAttachment}
                  loading={addAttachmentMutation.isPending}
                  disabled={addAttachmentMutation.isPending}
                  style={styles.saveButton}
                >
                  Attach Existing URL
                </Button>
              </View>
            </View>
          )}
        </>
      )}
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
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  title: {
    color: colors.text,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.muted,
    marginTop: 2,
  },
  chapterTabs: {
    marginHorizontal: -spacing.lg,
    marginBottom: spacing.lg,
  },
  chapterTab: {
    maxWidth: 190,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginLeft: spacing.lg,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  chapterTabSelected: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  chapterTabText: {
    color: colors.muted,
    fontWeight: '700',
  },
  chapterTabTextSelected: {
    color: colors.surface,
  },
  editor: {
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.lg,
    ...shadow.card,
  },
  editorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    color: colors.text,
    fontWeight: '800',
  },
  input: {
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  toggleRow: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    marginBottom: spacing.sm,
  },
  toggleTitle: {
    color: colors.text,
    fontWeight: '700',
  },
  toggleMeta: {
    color: colors.muted,
    marginTop: 2,
  },
  saveButton: {
    borderRadius: radius.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  attachmentsPanel: {
    marginTop: spacing.md,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  fallbackLabel: {
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  attachmentRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  attachmentBody: {
    flex: 1,
  },
  attachmentName: {
    color: colors.text,
    fontWeight: '700',
  },
  attachmentMeta: {
    color: colors.muted,
    marginTop: 2,
  },
});

export default ManageChaptersScreen;





