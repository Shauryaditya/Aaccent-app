import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, IconButton } from 'react-native-paper';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StudentStackParamList, Chapter } from '../../types';
import { courseService } from '../../services/courseService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { showToast } from '../../utils/helpers';
import { VideoView, useVideoPlayer } from 'expo-video';

type RouteProps = RouteProp<StudentStackParamList, 'ChapterView'>;

const ChapterViewScreen: React.FC = () => {
  const route = useRoute<RouteProps>();
  const { chapterId, courseId } = route.params;
  const queryClient = useQueryClient();
  const [isCompleted, setIsCompleted] = useState(false);

  const { data: chapter, isLoading } = useQuery<Chapter>({
    queryKey: ['chapter', chapterId],
    queryFn: () => courseService.getChapterById(chapterId),
    onSuccess: (data) => {
      setIsCompleted(data.userProgress?.[0]?.isCompleted || false);
    },
  });

  const completeMutation = useMutation({
    mutationFn: (complete: boolean) =>
      complete
        ? courseService.markChapterComplete(chapterId)
        : courseService.markChapterIncomplete(chapterId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chapter', chapterId] });
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
      showToast('success', isCompleted ? 'Marked as incomplete' : 'Chapter completed!');
    },
  });

  // Setup video player if video exists
  const videoPlayer = chapter?.videoUrl
    ? useVideoPlayer(chapter.muxData?.playbackId
        ? `https://stream.mux.com/${chapter.muxData.playbackId}.m3u8`
        : chapter.videoUrl,
        player => {
          player.loop = false;
        }
      )
    : null;

  const handleToggleComplete = () => {
    const newState = !isCompleted;
    setIsCompleted(newState);
    completeMutation.mutate(newState);
  };

  if (isLoading || !chapter) {
    return <LoadingSpinner message="Loading chapter..." />;
  }

  return (
    <ScrollView style={styles.container}>
      {chapter.videoUrl && videoPlayer && (
        <View style={styles.videoContainer}>
          <VideoView
            style={styles.video}
            player={videoPlayer}
            allowsFullscreen
            allowsPictureInPicture
          />
        </View>
      )}

      <View style={styles.content}>
        <View style={styles.header}>
          <Text variant="headlineSmall" style={styles.title}>
            {chapter.title}
          </Text>
          <IconButton
            icon={isCompleted ? 'check-circle' : 'circle-outline'}
            size={28}
            iconColor={isCompleted ? '#16a34a' : '#9ca3af'}
            onPress={handleToggleComplete}
          />
        </View>

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
            {chapter.attachments.map((attachment) => (
              <View key={attachment.id} style={styles.attachment}>
                <IconButton icon="file-document" size={20} />
                <Text variant="bodyMedium" style={styles.attachmentName}>
                  {attachment.name}
                </Text>
              </View>
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
    backgroundColor: '#f9fafb',
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
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    flex: 1,
    fontWeight: 'bold',
  },
  description: {
    color: '#4b5563',
    lineHeight: 24,
    marginBottom: 24,
  },
  attachmentsContainer: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 1,
  },
  attachmentsTitle: {
    marginBottom: 12,
    fontWeight: 'bold',
  },
  attachment: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  attachmentName: {
    flex: 1,
  },
  completeButton: {
    marginTop: 8,
  },
});

export default ChapterViewScreen;