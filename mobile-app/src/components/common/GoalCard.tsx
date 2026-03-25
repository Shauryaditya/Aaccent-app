import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Title, Paragraph, Chip } from 'react-native-paper';
import { Goal } from '../../types';
import { formatDate, isDatePast } from '../../utils/date';
import { Ionicons } from '@expo/vector-icons';

interface GoalCardProps {
  goal: Goal;
  onPress?: () => void;
}

const GoalCard: React.FC<GoalCardProps> = ({ goal, onPress }) => {
  const isPastDue = isDatePast(goal.dueDate) && !goal.isCompleted;

  return (
    <Card style={styles.card} onPress={onPress}>
      <Card.Content>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Title style={styles.title} numberOfLines={2}>
              {goal.title}
            </Title>
            {goal.isCompleted && (
              <Ionicons name="checkmark-circle" size={24} color="#16a34a" />
            )}
          </View>
        </View>
        {goal.description && (
          <Paragraph numberOfLines={2} style={styles.description}>
            {goal.description}
          </Paragraph>
        )}
        <View style={styles.footer}>
          <Chip
            icon="calendar"
            style={[styles.chip, isPastDue && styles.pastDueChip]}
            textStyle={[styles.chipText, isPastDue && styles.pastDueText]}
          >
            Due: {formatDate(goal.dueDate, 'MMM dd, yyyy')}
          </Chip>
          {goal.course && (
            <Chip icon="book" style={styles.chip} textStyle={styles.chipText}>
              Course
            </Chip>
          )}
          {goal.testSeries && (
            <Chip icon="clipboard" style={styles.chip} textStyle={styles.chipText}>
              Test Series
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
    elevation: 2,
  },
  header: {
    marginBottom: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  chip: {
    height: 28,
  },
  chipText: {
    fontSize: 12,
  },
  pastDueChip: {
    backgroundColor: '#fee2e2',
  },
  pastDueText: {
    color: '#dc2626',
  },
});

export default GoalCard;