import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Text, Button, IconButton } from 'react-native-paper';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { VideoView, useVideoPlayer } from 'expo-video';
import * as WebBrowser from 'expo-web-browser';
import { StudentStackParamList, Attachment, Chapter } from '../../types';
import { courseService } from '../../services/courseService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { showToast } from '../../utils/helpers';
import { colors, radius, shadow, spacing } from '../../theme/design';

type RouteProps = RouteProp<StudentStackParamList, 'ChapterView'>;

const isYouTubeUrl = (url?: string) => !!url && /(?:youtube\.com|youtu\.be)/i.test(url);

const ChapterViewScreen: React.FC = () => {
  const route = useRoute<RouteProps>();
  const { chapterId, courseId } = route.params;
  const queryClient = useQueryClient();
  const [isCompleted, setIsCompleted] = useState(false);

  const { data: chapter, isLoading } = useQuery<Chapter>({
    queryKey: ['chapter', chapterId],
    queryFn: () => courseService.getChapterById(courseId, chapterId),
  });

  useEffect(() => {
    if (chapter) {
      setIsCompleted(chapter.userProgress?.[0]?.isCompleted || false);
    }
  }, [chapter]);

  const completeMutation = useMutation({
    mutationFn: (complete: boolean) =>
      complete
        ? courseService.markChapterComplete(courseId, chapterId)
        : courseService.markChapterIncomplete(courseId, chapterId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chapter', chapterId] });
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
      showToast('success', isCompleted ? 'Marked as incomplete' : 'Chapter completed!');
    },
  });

  const videoSource = useMemo(() => {
    if (!chapter?.videoUrl || isYouTubeUrl(chapter.videoUrl)) {
      return null;
    }

    return chapter.muxData?.playbackId
      ? `https://stream.mux.com/${chapter.muxData.playbackId}.m3u8`
      : chapter.videoUrl;
  }, [chapter]);

  const videoPlayer = useVideoPlayer(videoSource, (player) => {
    player.loop = false;
  });

  const handleToggleComplete = () => {
    const newState = !isCompleted;
    setIsCompleted(newState);
    completeMutation.mutate(newState);
  };

  const openUrl = async (url: string) => {
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch (error) {
      showToast('error', 'Could not open file');
    }
  };

  if (isLoading || !chapter) {
    return <LoadingSpinner message="Loading chapter..." />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {videoSource && (
        <View style={styles.videoContainer}>
          <VideoView
            style={styles.video}
            player={videoPlayer}
            fullscreenOptions={{ enable: true }}
            allowsPictureInPicture
          />
        </View>
      )}

      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text variant="headlineSmall" style={styles.title}>
              {chapter.title}
            </Text>
            <Text variant="bodySmall" style={styles.meta}>
              {chapter.isFree ? 'Preview chapter' : 'Locked chapter'}
            </Text>
          </View>
          <IconButton
            icon={isCompleted ? 'check-circle' : 'circle-outline'}
            size={28}
            iconColor={isCompleted ? colors.success : '#9ca3af'}
            onPress={handleToggleComplete}
          />
        </View>

        {isYouTubeUrl(chapter.videoUrl) && (
          <Button
            mode="contained-tonal"
            icon="youtube"
            onPress={() => openUrl(chapter.videoUrl!)}
            style={styles.videoLinkButton}
          >
            Open video lesson
          </Button>
        )}

        {chapter.description && (
          <Text variant="bodyLarge" style={styles.description}>
            {chapter.description}
          </Text>
        )}

        {chapter.attachments && chapter.attachments.length > 0 && (
          <View style={styles.attachmentsContainer}>
            <Text variant="titleMedium" style={styles.attachmentsTitle}>
              Attachments
            </Text>
            {chapter.attachments.map((attachment: Attachment) => (
              <Pressable
                key={attachment.id}
                style={styles.attachment}
                onPress={() => openUrl(attachment.url)}
              >
                <View style={styles.attachmentIcon}>
                  <IconButton icon="file-document-outline" size={20} iconColor={colors.navy} />
                </View>
                <View style={styles.attachmentBody}>
                  <Text variant="bodyMedium" style={styles.attachmentName} numberOfLines={1}>
                    {attachment.name || 'Attachment'}
                  </Text>
                  <Text variant="bodySmall" style={styles.attachmentMeta}>Tap to open</Text>
                </View>
                <IconButton icon="open-in-new" size={18} iconColor={colors.muted} />
              </Pressable>
            ))}
          </View>
        )}

        <Button
          mode="contained"
          onPress={handleToggleComplete}
          style={styles.completeButton}
          disabled={completeMutation.isPending}
        >
          {isCompleted ? 'Mark as Incomplete' : 'Mark as Complete'}
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  videoContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  content: {
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontWeight: '800',
    color: colors.text,
  },
  meta: {
    color: colors.muted,
    marginTop: 4,
  },
  videoLinkButton: {
    marginBottom: spacing.lg,
    borderRadius: radius.sm,
  },
  description: {
    color: '#4b5563',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  attachmentsContainer: {
    marginBottom: spacing.xl,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    ...shadow.card,
  },
  attachmentsTitle: {
    marginBottom: spacing.sm,
    fontWeight: '800',
    color: colors.text,
  },
  attachment: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  attachmentIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.sm,
    backgroundColor: colors.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  attachmentBody: {
    flex: 1,
  },
  attachmentName: {
    color: colors.text,
    fontWeight: '600',
  },
  attachmentMeta: {
    color: colors.muted,
    marginTop: 2,
  },
  completeButton: {
    marginTop: spacing.sm,
    borderRadius: radius.sm,
  },
});

export default ChapterViewScreen;
