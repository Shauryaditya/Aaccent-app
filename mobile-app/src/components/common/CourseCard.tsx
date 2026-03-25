import React from 'react';
import { StyleSheet } from 'react-native';
import { Card as PaperCard, Title, Paragraph } from 'react-native-paper';
import { Course } from '../../types';
import { formatCurrency } from '../../utils/format';

interface CourseCardProps {
  course: Course;
  onPress: () => void;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, onPress }) => {
  return (
    <PaperCard style={styles.card} onPress={onPress}>
      {course.imageUrl && (
        <PaperCard.Cover source={{ uri: course.imageUrl }} style={styles.cover} />
      )}
      <PaperCard.Content style={styles.content}>
        <Title numberOfLines={2}>{course.title}</Title>
        {course.description && (
          <Paragraph numberOfLines={2} style={styles.description}>
            {course.description}
          </Paragraph>
        )}
        {course.category && (
          <Paragraph style={styles.category}>{course.category.name}</Paragraph>
        )}
        {course.price !== undefined && course.price > 0 && (
          <Title style={styles.price}>{formatCurrency(course.price)}</Title>
        )}
        {course.price === 0 && <Title style={styles.free}>Free</Title>}
      </PaperCard.Content>
    </PaperCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  cover: {
    height: 150,
  },
  content: {
    paddingTop: 12,
  },
  description: {
    color: '#666',
    marginTop: 4,
  },
  category: {
    color: '#6366f1',
    fontSize: 12,
    marginTop: 8,
  },
  price: {
    color: '#16a34a',
    marginTop: 8,
    fontSize: 20,
  },
  free: {
    color: '#16a34a',
    marginTop: 8,
    fontSize: 20,
  },
});

export default CourseCard;