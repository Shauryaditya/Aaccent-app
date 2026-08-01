import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { goalService } from '../../services/goalService';
import { Goal } from '../../types';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import GoalCard from '../../components/common/GoalCard';

const MyGoalsScreen: React.FC = () => {
  const { data: goals = [], isLoading } = useQuery<Goal[]>({
    queryKey: ['my-goals'],
    queryFn: () => goalService.getMyGoals(),
  });

  if (isLoading) {
    return <LoadingSpinner message="Loading your goals..." />;
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>
            My Goals
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            {goals.length} {goals.length === 1 ? 'goal' : 'goals'} assigned
          </Text>
        </View>

        <View style={styles.goalsContainer}>
          {goals.length === 0 ? (
            <EmptyState
              icon="flag"
              title="No goals yet"
              message="Your teacher will assign goals to help track your progress"
            />
          ) : (
            goals.map((goal: Goal) => <GoalCard key={goal.id} goal={goal} />)
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    elevation: 2,
    marginBottom: 8,
  },
  title: {
    marginBottom: 4,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#666',
  },
  goalsContainer: {
    padding: 16,
  },
});

export default MyGoalsScreen;
