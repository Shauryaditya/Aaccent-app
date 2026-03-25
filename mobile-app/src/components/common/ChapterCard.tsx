import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Title, Paragraph, Chip, ProgressBar } from 'react-native-paper';
import { Chapter } from '../../types';
import { Ionicons } from '@expo/vector-icons';

interface ChapterCardProps {
  chapter: Chapter;
  onPress: () => void;
  isCompleted?: boolean;
}

const ChapterCard: React.FC<ChapterCardProps> = ({ chapter, onPress, isCompleted }) => {
  return (
    <Card style={styles.card} onPress={onPress}>
      <Card.Content>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Title style={styles.title} numberOfLines={1}>
              {chapter.position}. {chapter.title}
            </Title>
            {isCompleted && (
              <Ionicons name="checkmark-circle" size={24} color="#16a34a" />
            )}
          </View>
        </View>
        {chapter.description && (
          <Paragraph numberOfLines={2} style={styles.description}>
            {chapter.description}
          </Paragraph>
        )}
        <View style={styles.chipContainer}>
          {chapter.videoUrl && (
            <Chip icon="play" style={styles.chip} textStyle={styles.chipText}>
              Video
            </Chip>
          )}
          {chapter.isFree && (
            <Chip icon="lock-open" style={styles.chip} textStyle={styles.chipText}>
              Free Preview
            </Chip>
          )}
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    elevation: 1,
  },
  header: {
    marginBottom: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    flex: 1,
  },
  description: {
    color: '#666',
    fontSize: 14,
    marginTop: 4,
  },
  chipContainer: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  chip: {
    height: 28,
  },
  chipText: {
    fontSize: 12,
  },
});

export default ChapterCard;