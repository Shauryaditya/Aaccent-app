import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card as PaperCard, Text } from 'react-native-paper';
import { Course } from '../../types';
import { formatCurrency } from '../../utils/format';
import { colors, radius, shadow, spacing } from '../../theme/design';

interface CourseCardProps {
  course: Course;
  onPress: () => void;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, onPress }) => {
  const lessonCount = course.chapters?.length || 0;
  const priceLabel = course.price && course.price > 0 ? formatCurrency(course.price) : 'Free';

  return (
    <PaperCard style={styles.card} onPress={onPress} mode="contained">
      <View style={styles.row}>
        <View style={styles.iconTile}>
          <Ionicons name="book-outline" size={22} color={colors.navy} />
        </View>

        <View style={styles.content}>
          {course.category && (
            <Text variant="labelSmall" style={styles.category} numberOfLines={1}>
              {course.category.name}
            </Text>
          )}
          <Text variant="titleMedium" style={styles.title} numberOfLines={2}>
            {course.title}
          </Text>
          <Text variant="bodySmall" style={styles.meta} numberOfLines={1}>
            {lessonCount} {lessonCount === 1 ? 'lesson' : 'lessons'} · {priceLabel}
          </Text>
        </View>

        <View style={styles.actionCircle}>
          <Ionicons name="play" size={15} color={colors.navy} />
        </View>
      </View>
    </PaperCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    ...shadow.card,
  },
  row: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  iconTile: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.tealSoft,
    marginRight: spacing.md,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  category: {
    color: colors.muted,
    marginBottom: 2,
  },
  title: {
    color: colors.text,
    fontWeight: '700',
    lineHeight: 20,
  },
  meta: {
    color: colors.muted,
    marginTop: 4,
  },
  actionCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.faint,
    marginLeft: spacing.md,
  },
});

export default CourseCard;
