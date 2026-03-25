import React from 'react';
import { View, StyleSheet } from 'react-native';
import EmptyState from '../../components/common/EmptyState';

const TeacherDashboardScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <EmptyState
        icon="stats-chart"
        title="Teacher Dashboard"
        message="Analytics and overview to be implemented"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
});

export default TeacherDashboardScreen;